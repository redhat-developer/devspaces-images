package solver

import (
	"fmt"

	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/devfile/devworkspace-operator/pkg/constants"
	routeV1 "github.com/openshift/api/route/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// This method is used compose the object names (both Kubernetes objects and "objects" within Traefik configuration)
// representing object endpoints.
func getEndpointExposingObjectName(machineName string, workspaceID string, port int32, endpointName string) string {
	if endpointName == "" {
		return fmt.Sprintf("%s-%s-%d", workspaceID, machineName, port)
	}
	return fmt.Sprintf("%s-%s-%d-%s", workspaceID, machineName, port, endpointName)
}

func getRouteForService(order int, machineName string, endpointName string, port int32, baseDomain string, workspaceID string, service *corev1.Service) routeV1.Route {
	targetEndpoint := intstr.FromInt(int(port))
	return routeV1.Route{
		ObjectMeta: metav1.ObjectMeta{
			Name:      getEndpointExposingObjectName(machineName, workspaceID, port, endpointName),
			Namespace: service.Namespace,
			Labels: map[string]string{
				constants.WorkspaceIDLabel: workspaceID,
			},
			Annotations:     routeAnnotations(machineName, endpointName),
			OwnerReferences: service.OwnerReferences,
		},
		Spec: routeV1.RouteSpec{
			Host: hostName(order, workspaceID, baseDomain),
			TLS: &routeV1.TLSConfig{
				InsecureEdgeTerminationPolicy: routeV1.InsecureEdgeTerminationPolicyRedirect,
				Termination:                   routeV1.TLSTerminationEdge,
			},
			To: routeV1.RouteTargetReference{
				Kind: "Service",
				Name: service.Name,
			},
			Port: &routeV1.RoutePort{
				TargetPort: targetEndpoint,
			},
		},
	}
}

func getIngressForService(order int, machineName string, endpointName string, port int32, baseDomain string, workspaceID string, service *corev1.Service) v1beta1.Ingress {
	targetEndpoint := intstr.FromInt(int(port))
	hostname := hostName(order, workspaceID, baseDomain)
	ingressPathType := v1beta1.PathTypeImplementationSpecific
	return v1beta1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      getEndpointExposingObjectName(machineName, workspaceID, port, endpointName),
			Namespace: service.Namespace,
			Labels: map[string]string{
				constants.WorkspaceIDLabel: workspaceID,
			},
			Annotations:     nginxIngressAnnotations(machineName, endpointName),
			OwnerReferences: service.OwnerReferences,
		},
		Spec: v1beta1.IngressSpec{
			Rules: []v1beta1.IngressRule{
				{
					Host: hostname,
					IngressRuleValue: v1beta1.IngressRuleValue{
						HTTP: &v1beta1.HTTPIngressRuleValue{
							Paths: []v1beta1.HTTPIngressPath{
								{
									Backend: v1beta1.IngressBackend{
										ServiceName: service.Name,
										ServicePort: targetEndpoint,
									},
									PathType: &ingressPathType,
									Path:     "/",
								},
							},
						},
					},
				},
			},
		},
	}
}

func hostName(order int, workspaceID string, baseDomain string) string {
	return fmt.Sprintf("%s-%d.%s", workspaceID, order+1, baseDomain)
}

func routeAnnotations(machineName string, endpointName string) map[string]string {
	return map[string]string{
		defaults.ConfigAnnotationEndpointName:  endpointName,
		defaults.ConfigAnnotationComponentName: machineName,
	}
}

func nginxIngressAnnotations(machineName string, endpointName string) map[string]string {
	return map[string]string{
		"kubernetes.io/ingress.class":              "nginx",
		"nginx.ingress.kubernetes.io/ssl-redirect": "false",
		defaults.ConfigAnnotationEndpointName:      endpointName,
		defaults.ConfigAnnotationComponentName:     machineName,
	}
}
