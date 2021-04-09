package gateway

import (
	"context"

	"github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/che-incubator/devworkspace-che-operator/pkg/sync"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"k8s.io/api/extensions/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
)

var (
	ingressDiffOpts = cmp.Options{
		cmpopts.IgnoreFields(v1beta1.Ingress{}, "TypeMeta", "ObjectMeta", "Status"),
	}
)

func (g *CheGateway) reconcileIngress(syncer sync.Syncer, ctx context.Context, manager *v1alpha1.CheManager) (bool, string, error) {
	ingress := getIngressSpec(manager)
	var changed bool
	var err error
	var ingressHost string

	if !manager.Spec.GatewayDisabled {
		var inCluster runtime.Object
		changed, inCluster, err = syncer.Sync(ctx, manager, ingress, ingressDiffOpts)
		if err != nil {
			return changed, "", err
		}
		ingressHost = inCluster.(*v1beta1.Ingress).Spec.Rules[0].Host
	} else {
		changed, ingressHost, err = true, "", syncer.Delete(ctx, ingress)
	}

	return changed, ingressHost, err
}

func getIngressSpec(manager *v1alpha1.CheManager) *v1beta1.Ingress {
	pathType := v1beta1.PathTypeImplementationSpecific
	return &v1beta1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "external-access"),
			Annotations: map[string]string{
				"kubernetes.io/ingress.class":                       "nginx",
				"nginx.ingress.kubernetes.io/proxy-read-timeout":    "3600",
				"nginx.ingress.kubernetes.io/proxy-connect-timeout": "3600",
				// "nginx.ingress.kubernetes.io/ssl-redirect":          "true", - do we need this?
			},
		},
		Spec: v1beta1.IngressSpec{
			Rules: []v1beta1.IngressRule{
				{
					Host: manager.Spec.GatewayHost,
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
}
