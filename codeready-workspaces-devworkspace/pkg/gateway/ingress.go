package gateway

import (
	"context"
	"reflect"

	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/che-incubator/devworkspace-che-operator/pkg/sync"
	"github.com/eclipse-che/che-operator/pkg/apis/org"
	"github.com/eclipse-che/che-operator/pkg/apis/org/v2alpha1"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"k8s.io/api/extensions/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
)

var (
	ingressDiffOpts = cmp.Options{
		cmpopts.IgnoreFields(v1beta1.Ingress{}, "TypeMeta", "Status"),
		cmp.Comparer(func(x, y metav1.ObjectMeta) bool {
			return reflect.DeepEqual(x.Labels, y.Labels)
		}),
	}
)

func (g *CheGateway) reconcileIngress(syncer sync.Syncer, ctx context.Context, manager *v2alpha1.CheCluster) (bool, string, error) {
	ingress := getIngressSpec(manager)
	var changed bool
	var err error
	var ingressHost string

	if manager.Spec.Gateway.IsEnabled() {
		var inCluster runtime.Object
		changed, inCluster, err = syncer.Sync(ctx, org.AsV1(manager), ingress, ingressDiffOpts)
		if err != nil {
			return changed, "", err
		}
		ingressHost = inCluster.(*v1beta1.Ingress).Spec.Rules[0].Host
	} else {
		changed, ingressHost, err = true, "", syncer.Delete(ctx, ingress)
	}

	return changed, ingressHost, err
}

func getIngressSpec(manager *v2alpha1.CheCluster) *v1beta1.Ingress {
	host := manager.Spec.Gateway.Host
	if host == "" {
		host = manager.Spec.WorkspaceDomainEndpoints.BaseDomain
	}

	pathType := v1beta1.PathTypeImplementationSpecific
	ingress := &v1beta1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:        manager.Name,
			Namespace:   manager.Namespace,
			Labels:      defaults.GetLabelsForComponent(manager, "external-access"),
			Annotations: defaults.GetIngressAnnotations(manager),
		},
		Spec: v1beta1.IngressSpec{
			Rules: []v1beta1.IngressRule{
				{
					Host: host,
					IngressRuleValue: v1beta1.IngressRuleValue{
						HTTP: &v1beta1.HTTPIngressRuleValue{
							Paths: []v1beta1.HTTPIngressPath{
								{
									Path:     "/",
									PathType: &pathType,
									Backend: v1beta1.IngressBackend{
										ServiceName: GetGatewayServiceName(manager),
										ServicePort: intstr.FromInt(GatewayPort),
									},
								},
							},
						},
					},
				},
			},
		},
	}

	if manager.Spec.Gateway.TlsSecretName != "" {
		ingress.Spec.TLS = []v1beta1.IngressTLS{
			{
				Hosts:      []string{manager.Spec.Gateway.Host},
				SecretName: manager.Spec.Gateway.TlsSecretName,
			},
		}
	}

	return ingress
}
