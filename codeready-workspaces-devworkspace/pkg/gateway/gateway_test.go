package gateway

import (
	"context"
	"testing"

	"github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	extensions "k8s.io/api/extensions/v1beta1"
	rbac "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func createTestScheme() *runtime.Scheme {
	infrastructure.InitializeForTesting(infrastructure.Kubernetes)

	scheme := runtime.NewScheme()

	utilruntime.Must(v1alpha1.AddToScheme(scheme))
	utilruntime.Must(extensions.AddToScheme(scheme))
	utilruntime.Must(corev1.AddToScheme(scheme))
	utilruntime.Must(appsv1.AddToScheme(scheme))
	utilruntime.Must(rbac.AddToScheme(scheme))
	utilruntime.Must(routev1.AddToScheme(scheme))

	return scheme
}

func TestCreate(t *testing.T) {
	scheme := createTestScheme()

	cl := fake.NewFakeClientWithScheme(scheme)
	ctx := context.TODO()

	gateway := CheGateway{client: cl, scheme: scheme}

	managerName := "che"
	ns := "default"

	_, _, err := gateway.Sync(ctx, &v1alpha1.CheManager{
		ObjectMeta: v1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost: "over.the.rainbow",
		},
	})
	if err != nil {
		t.Fatalf("Error while syncing: %s", err)
	}

	TestGatewayObjectsExist(t, ctx, cl, managerName, ns)
}

func TestDelete(t *testing.T) {
	managerName := "che"
	ns := "default"

	scheme := createTestScheme()

	cl := fake.NewFakeClientWithScheme(scheme,
		&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&rbac.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&rbac.Role{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&corev1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		},
		&corev1.Service{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
			},
		})

	ctx := context.TODO()

	gateway := CheGateway{client: cl, scheme: scheme}

	err := gateway.Delete(ctx, &v1alpha1.CheManager{
		ObjectMeta: v1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost:     "over.the.rainbow",
			GatewayDisabled: false,
		},
	})
	if err != nil {
		t.Fatalf("Error while syncing: %s", err)
	}

	TestGatewayObjectsDontExist(t, ctx, cl, managerName, ns)
}
