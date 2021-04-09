//
// Copyright (c) 2019-2021 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package solver

import (
	"context"
	"fmt"
	"path"
	"strings"

	"github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	dwoche "github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/che-incubator/devworkspace-che-operator/pkg/sync"
	dw "github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	dwo "github.com/devfile/devworkspace-operator/apis/controller/v1alpha1"
	"github.com/devfile/devworkspace-operator/controllers/controller/devworkspacerouting/solvers"
	"github.com/devfile/devworkspace-operator/pkg/common"
	"github.com/devfile/devworkspace-operator/pkg/constants"
	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	"github.com/google/go-cmp/cmp/cmpopts"
	routeV1 "github.com/openshift/api/route/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/yaml"
)

const (
	uniqueEndpointAttributeName              = "unique"
	urlRewriteSupportedEndpointAttributeName = "urlRewriteSupported"
	endpointURLPrefixPattern                 = "/%s/%s/%d"
	// note - che-theia DEPENDS on this format - we should not change this unless crosschecked with the che-theia impl
	uniqueEndpointURLPrefixPattern = "/%s/%s/%s"
)

var (
	configMapDiffOpts = cmpopts.IgnoreFields(corev1.ConfigMap{}, "TypeMeta", "ObjectMeta")
)

func (c *CheRoutingSolver) cheSpecObjects(cheManager *dwoche.CheManager, routing *dwo.DevWorkspaceRouting, workspaceMeta solvers.WorkspaceMetadata) (solvers.RoutingObjects, error) {
	objs := solvers.RoutingObjects{}

	objs.Services = solvers.GetDiscoverableServicesForEndpoints(routing.Spec.Endpoints, workspaceMeta)

	commonService := solvers.GetServiceForEndpoints(routing.Spec.Endpoints, workspaceMeta, false, dw.PublicEndpointExposure, dw.InternalEndpointExposure)
	if commonService != nil {
		objs.Services = append(objs.Services, *commonService)
	}

	annos := map[string]string{}
	annos[defaults.ConfigAnnotationCheManagerName] = cheManager.Name
	annos[defaults.ConfigAnnotationCheManagerNamespace] = cheManager.Namespace

	additionalLabels := defaults.GetLabelsForComponent(cheManager, "exposure")

	for i := range objs.Services {
		// need to use a ref otherwise s would be a copy
		s := &objs.Services[i]

		if s.Labels == nil {
			s.Labels = map[string]string{}
		}

		for k, v := range additionalLabels {

			if len(s.Labels[k]) == 0 {
				s.Labels[k] = v
			}
		}

		if s.Annotations == nil {
			s.Annotations = map[string]string{}
		}

		for k, v := range annos {

			if len(s.Annotations[k]) == 0 {
				s.Annotations[k] = v
			}
		}
	}

	// k, now we have to create our own objects for configuring the gateway
	configMaps, err := c.getGatewayConfigsAndFillRoutingObjects(cheManager, workspaceMeta.WorkspaceId, routing, &objs)
	if err != nil {
		return solvers.RoutingObjects{}, err
	}

	syncer := sync.New(c.client, c.scheme)

	for _, cm := range configMaps {
		_, _, err := syncer.Sync(context.TODO(), nil, &cm, configMapDiffOpts)
		if err != nil {
			return solvers.RoutingObjects{}, err
		}

	}

	return objs, nil
}

func (c *CheRoutingSolver) cheExposedEndpoints(manager *dwoche.CheManager, workspaceID string, endpoints map[string]dwo.EndpointList, routingObj solvers.RoutingObjects) (exposedEndpoints map[string]dwo.ExposedEndpointList, ready bool, err error) {
	if manager.Status.GatewayPhase != dwoche.GatewayPhaseEstablished {
		return nil, false, nil
	}

	gatewayHost := manager.Status.GatewayHost

	exposed := map[string]dwo.ExposedEndpointList{}

	for machineName, endpoints := range endpoints {
		exposedEndpoints := dwo.ExposedEndpointList{}
		for _, endpoint := range endpoints {
			if endpoint.Exposure != dw.PublicEndpointExposure {
				continue
			}

			var scheme string
			if endpoint.Protocol == "" {
				scheme = "http"
			} else {
				scheme = string(endpoint.Protocol)
			}

			if !isExposableScheme(scheme) {
				// we cannot expose non-http endpoints publicly, because ingresses/routes only support http(s)
				continue
			}

			if endpoint.Secure {
				scheme = secureScheme(scheme)

				// TODO this should also do the magic of ensuring user authentication however we are going to do it
				// in the future
			}

			// try to find the endpoint in the ingresses/routes first. If it is there, it is exposed on a subdomain
			// otherwise it is exposed through the gateway
			var endpointURL string
			if infrastructure.IsOpenShift() {
				route := findRouteForEndpoint(machineName, endpoint, &routingObj)
				if route != nil {
					endpointURL = path.Join(route.Spec.Host, endpoint.Path)
				}
			} else {
				ingress := findIngressForEndpoint(machineName, endpoint, &routingObj)
				if ingress != nil {
					endpointURL = path.Join(ingress.Spec.Rules[0].Host, endpoint.Path)
				}
			}

			if endpointURL == "" {
				if manager.Spec.GatewayDisabled {
					return map[string]dwo.ExposedEndpointList{}, false, fmt.Errorf("couldn't find an ingress/route for an endpoint `%s` in workspace `%s`, this is a bug", endpoint.Name, workspaceID)
				}

				if gatewayHost == "" {
					// the gateway has not yet established the host
					return map[string]dwo.ExposedEndpointList{}, false, nil
				}

				publicURLPrefix := getPublicURLPrefixForEndpoint(workspaceID, machineName, endpoint)
				endpointURL = path.Join(gatewayHost, publicURLPrefix, endpoint.Path)
			}

			publicURL := scheme + "://" + endpointURL

			// path.Join() removes the trailing slashes, so make sure to reintroduce that if required.
			if endpoint.Path == "" || strings.HasSuffix(endpoint.Path, "/") {
				publicURL = publicURL + "/"
			}

			exposedEndpoints = append(exposedEndpoints, dwo.ExposedEndpoint{
				Name:       endpoint.Name,
				Url:        publicURL,
				Attributes: endpoint.Attributes,
			})
		}
		exposed[machineName] = exposedEndpoints
	}

	return exposed, true, nil
}

func isExposableScheme(scheme string) bool {
	return strings.HasPrefix(scheme, "http") || strings.HasPrefix(scheme, "ws")
}

func secureScheme(scheme string) string {
	if scheme == "http" {
		return "https"
	} else if scheme == "ws" {
		return "wss"
	} else {
		return scheme
	}
}

func (c *CheRoutingSolver) getGatewayConfigsAndFillRoutingObjects(cheManager *dwoche.CheManager, workspaceID string, routing *dwo.DevWorkspaceRouting, objs *solvers.RoutingObjects) ([]corev1.ConfigMap, error) {
	restrictedAnno, setRestrictedAnno := routing.Annotations[constants.WorkspaceRestrictedAccessAnnotation]

	labels := defaults.GetLabelsForComponent(cheManager, "gateway-config")
	labels[constants.WorkspaceIDLabel] = workspaceID
	if setRestrictedAnno {
		labels[constants.WorkspaceRestrictedAccessAnnotation] = restrictedAnno
	}

	configMap := corev1.ConfigMap{
		ObjectMeta: v1.ObjectMeta{
			Name:      defaults.GetGatewayWorkpaceConfigMapName(workspaceID),
			Namespace: cheManager.Namespace,
			Labels:    labels,
			Annotations: map[string]string{
				defaults.ConfigAnnotationDevWorkspaceRoutingName:      routing.Name,
				defaults.ConfigAnnotationDevWorkspaceRoutingNamespace: routing.Namespace,
			},
		},
		Data: map[string]string{},
	}

	config := traefikConfig{
		HTTP: traefikConfigHTTP{
			Routers:     map[string]traefikConfigRouter{},
			Services:    map[string]traefikConfigService{},
			Middlewares: map[string]traefikConfigMiddleware{},
		},
	}

	// we just need something to make the route names unique.. We also need to make the names as short as possible while
	// being relatable to the workspaceID by mere human inspection. So let's just suffix the workspaceID with a "unique"
	// suffix, the easiest of which is the iteration order in the map.
	// Note that this means that the endpoints might get a different route/ingress name on each workspace start because
	// the iteration order is not guaranteed in Go maps. If we want stable ingress/route names for the endpoints, we need
	// to devise a different algorithm to produce them. Some kind of hash of workspaceID, machine name, endpoint name and port
	// might work but will not be relatable to the workspace ID just by looking at it anymore.
	order := 0
	for machineName, endpoints := range routing.Spec.Endpoints {
		singlehostPorts, multihostPorts := classifyEndpoints(!cheManager.Spec.GatewayDisabled, &order, &endpoints)

		addToTraefikConfig(routing.Namespace, workspaceID, machineName, singlehostPorts, &config)
		addToRoutingObjects(cheManager, routing.Namespace, routing.Spec.RoutingSuffix, workspaceID, machineName, multihostPorts, objs)
	}

	if len(config.HTTP.Routers) > 0 {
		contents, err := yaml.Marshal(config)
		if err != nil {
			return []corev1.ConfigMap{}, err
		}

		configMap.Data[workspaceID+".yml"] = string(contents)

		return []corev1.ConfigMap{configMap}, nil
	}

	return []corev1.ConfigMap{}, nil
}

func getTrackedEndpointName(endpoint *dw.Endpoint) string {
	name := ""
	if endpoint.Attributes.GetString(uniqueEndpointAttributeName, nil) == "true" {
		name = endpoint.Name
	}

	return name
}

// we need to support unique endpoints - so 1 port can actually be accessible
// multiple times, each time using a different resulting external URL.
// non-unique endpoints are all represented using a single external URL
func classifyEndpoints(gatewayEnabled bool, order *int, endpoints *dwo.EndpointList) (singlehostPorts map[int32]map[string]int, multihostPorts map[int32]map[string]int) {
	singlehostPorts = map[int32]map[string]int{}
	multihostPorts = map[int32]map[string]int{}
	for _, e := range *endpoints {
		if e.Exposure != dw.PublicEndpointExposure {
			continue
		}

		i := int32(e.TargetPort)

		name := ""
		if e.Attributes.GetString(uniqueEndpointAttributeName, nil) == "true" {
			name = e.Name
		}

		ports := multihostPorts
		if gatewayEnabled && e.Attributes.GetString(urlRewriteSupportedEndpointAttributeName, nil) == "true" {
			ports = singlehostPorts
		}

		if ports[i] == nil {
			ports[i] = map[string]int{}
		}

		if _, ok := ports[i][name]; !ok {
			ports[i][name] = *order
			*order = *order + 1
		}
	}

	return
}

func addToTraefikConfig(namespace string, workspaceID string, machineName string, portMapping map[int32]map[string]int, cfg *traefikConfig) {
	rtrs := cfg.HTTP.Routers
	srvcs := cfg.HTTP.Services
	mdls := cfg.HTTP.Middlewares

	for port, names := range portMapping {
		for endpointName := range names {
			name := getEndpointExposingObjectName(machineName, workspaceID, port, endpointName)
			var prefix string
			var serviceURL string

			prefix = getPublicURLPrefix(workspaceID, machineName, port, endpointName)
			serviceURL = getServiceURL(port, workspaceID, namespace)

			rtrs[name] = traefikConfigRouter{
				Rule:        fmt.Sprintf("PathPrefix(`%s`)", prefix),
				Service:     name,
				Middlewares: []string{name},
				Priority:    100,
			}

			srvcs[name] = traefikConfigService{
				LoadBalancer: traefikConfigLoadbalancer{
					Servers: []traefikConfigLoadbalancerServer{
						{
							URL: serviceURL,
						},
					},
				},
			}

			mdls[name] = traefikConfigMiddleware{
				StripPrefix: traefikConfigStripPrefix{
					Prefixes: []string{prefix},
				},
			}
		}
	}
}

func addToRoutingObjects(cheManager *v1alpha1.CheManager, namespace string, baseDomain string, workspaceID string, machineName string, portMapping map[int32]map[string]int, objs *solvers.RoutingObjects) {
	isOpenShift := infrastructure.IsOpenShift()

	for port, names := range portMapping {
		backingService := findServiceForPort(port, objs)
		for endpointName, order := range names {
			if isOpenShift {
				route := getRouteForService(order, machineName, endpointName, port, baseDomain, workspaceID, backingService)
				objs.Routes = append(objs.Routes, route)
			} else {
				ingress := getIngressForService(order, machineName, endpointName, port, baseDomain, workspaceID, backingService)
				objs.Ingresses = append(objs.Ingresses, ingress)
			}
		}
	}
}

func findServiceForPort(port int32, objs *solvers.RoutingObjects) *corev1.Service {
	for i := range objs.Services {
		svc := &objs.Services[i]
		for j := range svc.Spec.Ports {
			if svc.Spec.Ports[j].Port == port {
				return svc
			}
		}
	}

	return nil
}

func findIngressForEndpoint(machineName string, endpoint dw.Endpoint, objs *solvers.RoutingObjects) *v1beta1.Ingress {
	for i := range objs.Ingresses {
		ingress := &objs.Ingresses[i]

		if ingress.Annotations[defaults.ConfigAnnotationComponentName] != machineName ||
			ingress.Annotations[defaults.ConfigAnnotationEndpointName] != getTrackedEndpointName(&endpoint) {
			continue
		}

		for r := range ingress.Spec.Rules {
			rule := ingress.Spec.Rules[r]
			for p := range rule.HTTP.Paths {
				path := rule.HTTP.Paths[p]
				if path.Backend.ServicePort.IntVal == int32(endpoint.TargetPort) {
					return ingress
				}
			}
		}
	}

	return nil
}

func findRouteForEndpoint(machineName string, endpoint dw.Endpoint, objs *solvers.RoutingObjects) *routeV1.Route {
	service := findServiceForPort(int32(endpoint.TargetPort), objs)

	for r := range objs.Routes {
		route := &objs.Routes[r]
		if route.Annotations[defaults.ConfigAnnotationComponentName] == machineName &&
			route.Annotations[defaults.ConfigAnnotationEndpointName] == getTrackedEndpointName(&endpoint) &&
			route.Spec.To.Kind == "Service" &&
			route.Spec.To.Name == service.Name &&
			route.Spec.Port.TargetPort.IntValue() == endpoint.TargetPort {
			return route
		}
	}

	return nil
}

func (c *CheRoutingSolver) cheRoutingFinalize(cheManager *dwoche.CheManager, routing *dwo.DevWorkspaceRouting) error {
	configs := &corev1.ConfigMapList{}

	selector, err := labels.Parse(fmt.Sprintf("%s=%s", constants.WorkspaceIDLabel, routing.Spec.WorkspaceId))
	if err != nil {
		return err
	}

	listOpts := &client.ListOptions{
		Namespace:     cheManager.Namespace,
		LabelSelector: selector,
	}

	err = c.client.List(context.TODO(), configs, listOpts)
	if err != nil {
		return err
	}

	for _, cm := range configs.Items {
		err = c.client.Delete(context.TODO(), &cm)
		if err != nil {
			return err
		}
	}

	return nil
}

func getServiceURL(port int32, workspaceID string, workspaceNamespace string) string {
	// the default .cluster.local suffix of the internal domain names seems to be configurable, so let's just
	// not use it so we don't have to know about it...
	return fmt.Sprintf("http://%s.%s.svc:%d", common.ServiceName(workspaceID), workspaceNamespace, port)
}

func getPublicURLPrefixForEndpoint(workspaceID string, machineName string, endpoint dw.Endpoint) string {
	endpointName := ""
	if endpoint.Attributes.GetString(uniqueEndpointAttributeName, nil) == "true" {
		endpointName = endpoint.Name
	}

	return getPublicURLPrefix(workspaceID, machineName, int32(endpoint.TargetPort), endpointName)
}

func getPublicURLPrefix(workspaceID string, machineName string, port int32, uniqueEndpointName string) string {
	if uniqueEndpointName == "" {
		return fmt.Sprintf(endpointURLPrefixPattern, workspaceID, machineName, port)
	}
	return fmt.Sprintf(uniqueEndpointURLPrefixPattern, workspaceID, machineName, uniqueEndpointName)
}
