package gateway

import (
	"context"
	"testing"

	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	"github.com/eclipse-che/che-operator/pkg/apis"
	"github.com/eclipse-che/che-operator/pkg/apis/org/v2alpha1"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	extensions "k8s.io/api/extensions/v1beta1"
	"k8s.io/api/node/v1alpha1"
	rbac "k8s.io/api/rbac/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/utils/pointer"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func createTestScheme() *runtime.Scheme {
	scheme := runtime.NewScheme()

	utilruntime.Must(v1alpha1.AddToScheme(scheme))
	utilruntime.Must(extensions.AddToScheme(scheme))
	utilruntime.Must(corev1.AddToScheme(scheme))
	utilruntime.Must(appsv1.AddToScheme(scheme))
	utilruntime.Must(rbac.AddToScheme(scheme))
	utilruntime.Must(routev1.AddToScheme(scheme))
	utilruntime.Must(apis.AddToScheme(scheme))

	return scheme
}

func TestCreate(t *testing.T) {
	test := func(t *testing.T, infra infrastructure.Type) {
		infrastructure.InitializeForTesting(infra)

		scheme := createTestScheme()

		cl := fake.NewFakeClientWithScheme(scheme)
		ctx := context.TODO()

		gateway := CheGateway{client: cl, scheme: scheme}

		managerName := "che"
		ns := "default"

		_, _, err := gateway.Sync(ctx, &v2alpha1.CheCluster{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
			Spec: v2alpha1.CheClusterSpec{
				Gateway: v2alpha1.CheGatewaySpec{
					Host: "over.the.rainbow",
				},
			},
		})
		if err != nil {
			t.Fatalf("Error while syncing: %s", err)
		}

		AssertGatewayObjectsExist(t, ctx, cl, managerName, ns)
	}

	t.Run("openshift", func(t *testing.T) {
		test(t, infrastructure.OpenShiftv4)
	})

	t.Run("kubernetes", func(t *testing.T) {
		test(t, infrastructure.Kubernetes)
	})
}

func TestDelete(t *testing.T) {
	infrastructure.InitializeForTesting(infrastructure.Kubernetes)

	managerName := "che"
	ns := "default"

	scheme := createTestScheme()

	cl := fake.NewFakeClientWithScheme(scheme,
		&appsv1.Deployment{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&corev1.ConfigMap{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&rbac.RoleBinding{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&rbac.Role{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&corev1.ServiceAccount{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&corev1.Service{
			ObjectMeta: v1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		})

	ctx := context.TODO()

	gateway := CheGateway{client: cl, scheme: scheme}

	err := gateway.Delete(ctx, &v2alpha1.CheCluster{
		ObjectMeta: v1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v2alpha1.CheClusterSpec{
			Gateway: v2alpha1.CheGatewaySpec{
				Host:    "over.the.rainbow",
				Enabled: pointer.BoolPtr(true),
			},
		},
	})
	if err != nil {
		t.Fatalf("Error while syncing: %s", err)
	}

	AssertGatewayObjectsDontExist(t, ctx, cl, managerName, ns)
}

func TestUsesIngressAnnotationsForGatewayIngress(t *testing.T) {
	infrastructure.InitializeForTesting(infrastructure.Kubernetes)

	scheme := createTestScheme()
	cl := fake.NewFakeClientWithScheme(scheme)
	ctx := context.TODO()

	gateway := CheGateway{client: cl, scheme: scheme}

	managerName := "che"
	ns := "default"

	_, _, err := gateway.Sync(ctx, &v2alpha1.CheCluster{
		ObjectMeta: v1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v2alpha1.CheClusterSpec{
			Gateway: v2alpha1.CheGatewaySpec{
				Host: "over.the.rainbow",
			},
			K8s: v2alpha1.CheClusterSpecK8s{
				IngressAnnotations: map[string]string{
					"a": "b",
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("Error while syncing: %s", err)
	}

	AssertGatewayObjectsExist(t, ctx, cl, managerName, ns)

	ingress := extensions.Ingress{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &ingress); err != nil {
		t.Fatalf("Error while getting the ingress: %s", err)
	}

	if ingress.Annotations["a"] != "b" {
		t.Errorf("Unexpected ingress annotations")
	}
}

func TestUsesCustomCertificateForGatewayIngress(t *testing.T) {
	infrastructure.InitializeForTesting(infrastructure.Kubernetes)

	scheme := createTestScheme()
	cl := fake.NewFakeClientWithScheme(scheme)
	ctx := context.TODO()

	gateway := CheGateway{client: cl, scheme: scheme}

	managerName := "che"
	ns := "default"

	_, _, err := gateway.Sync(ctx, &v2alpha1.CheCluster{
		ObjectMeta: v1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v2alpha1.CheClusterSpec{
			Gateway: v2alpha1.CheGatewaySpec{
				Host:          "over.the.rainbow",
				TlsSecretName: "kachny",
			},
		},
	})
	if err != nil {
		t.Fatalf("Error while syncing: %s", err)
	}

	AssertGatewayObjectsExist(t, ctx, cl, managerName, ns)

	ingress := extensions.Ingress{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &ingress); err != nil {
		t.Fatalf("Error while getting the ingress: %s", err)
	}

	if ingress.Spec.TLS[0].SecretName != "kachny" {
		t.Errorf("Unexpected ingress tls secret name")
	}

	if len(ingress.Spec.TLS[0].Hosts) != 1 {
		t.Errorf("There should be 1 host for the TLS")
	}

	if ingress.Spec.TLS[0].Hosts[0] != "over.the.rainbow" {
		t.Errorf("Unexpected TLS host")
	}
}

func TestUsesCustomCertificateForGatewayRoute(t *testing.T) {
	infrastructure.InitializeForTesting(infrastructure.OpenShiftv4)

	scheme := createTestScheme()

	managerName := "che"
	ns := "default"

	cl := fake.NewFakeClientWithScheme(scheme, &corev1.Secret{
		ObjectMeta: v1.ObjectMeta{
			Name:      "tlsSecret",
			Namespace: ns,
		},
		Data: map[string][]byte{
			"tls.key": []byte("asdf"),
			"tls.crt": []byte("jkl;"),
		},
	})
	ctx := context.TODO()

	gateway := CheGateway{client: cl, scheme: scheme}

	_, _, err := gateway.Sync(ctx, &v2alpha1.CheCluster{
		ObjectMeta: v1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v2alpha1.CheClusterSpec{
			Gateway: v2alpha1.CheGatewaySpec{
				Host:          "over.the.rainbow",
				TlsSecretName: "tlsSecret",
			},
		},
	})
	if err != nil {
		t.Fatalf("Error while syncing: %s", err)
	}

	AssertGatewayObjectsExist(t, ctx, cl, managerName, ns)

	route := routev1.Route{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &route); err != nil {
		t.Fatalf("Error while getting the ingress: %s", err)
	}

	if route.Spec.TLS.Key != "asdf" {
		t.Errorf("Unexpected route tls key")
	}

	if route.Spec.TLS.Certificate != "jkl;" {
		t.Errorf("Unexpected route tls certificate")
	}

	if route.Spec.TLS.Termination != routev1.TLSTerminationEdge {
		t.Errorf("Routes should have edge TLS termination")
	}

	if route.Spec.TLS.InsecureEdgeTerminationPolicy != routev1.InsecureEdgeTerminationPolicyRedirect {
		t.Errorf("Routes should terminate insecure edge TLS using a redirect")
	}
}
