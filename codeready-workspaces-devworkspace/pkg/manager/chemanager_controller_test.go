package manager

import (
	"context"
	"reflect"
	"testing"
	"time"

	"github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/che-incubator/devworkspace-che-operator/pkg/gateway"
	"github.com/che-incubator/devworkspace-che-operator/pkg/sync"
	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	extensions "k8s.io/api/extensions/v1beta1"
	rbac "k8s.io/api/rbac/v1"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
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

func TestCreatesObjectsInSingleHost(t *testing.T) {
	managerName := "che"
	ns := "default"
	scheme := createTestScheme()
	ctx := context.TODO()
	cl := fake.NewFakeClientWithScheme(scheme, &v1alpha1.CheManager{
		ObjectMeta: metav1.ObjectMeta{
			Name:      managerName,
			Namespace: ns,
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost: "over.the.rainbow",
		},
	})

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	// first reconcile sets the finalizer, second reconcile actually finishes the process
	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}
	_, err = reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	gateway.TestGatewayObjectsExist(t, ctx, cl, managerName, ns)
}

func TestUpdatesObjectsInSingleHost(t *testing.T) {
	managerName := "che"
	ns := "default"

	scheme := createTestScheme()

	cl := fake.NewFakeClientWithScheme(scheme,
		&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:      managerName,
				Namespace: ns,
				Labels: map[string]string{
					"some":                   "label",
					"app.kubernetes.io/name": "not what we expect",
				},
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
		},
		&v1alpha1.CheManager{
			ObjectMeta: metav1.ObjectMeta{
				Name:       managerName,
				Namespace:  ns,
				Finalizers: []string{FinalizerName},
			},
			Spec: v1alpha1.CheManagerSpec{
				GatewayHost: "over.the.rainbow",
			},
		})

	ctx := context.TODO()

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	gateway.TestGatewayObjectsExist(t, ctx, cl, managerName, ns)

	depl := &appsv1.Deployment{}
	if err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, depl); err != nil {
		t.Fatalf("Failed to read the che manager deployment that should exist")
	}

	// checking that we got the update we wanted on the labels...
	expectedLabels := defaults.GetLabelsFromNames(managerName, "deployment")
	expectedLabels["some"] = "label"

	if !reflect.DeepEqual(expectedLabels, depl.GetLabels()) {
		t.Errorf("The deployment should have had its labels reset by the reconciler.")
	}
}

func TestDoesntCreateObjectsInMultiHost(t *testing.T) {
	managerName := "che"
	ns := "default"
	scheme := createTestScheme()
	ctx := context.TODO()
	cl := fake.NewFakeClientWithScheme(scheme, &v1alpha1.CheManager{
		ObjectMeta: metav1.ObjectMeta{
			Name:       managerName,
			Namespace:  ns,
			Finalizers: []string{FinalizerName},
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost:     "over.the.rainbow",
			GatewayDisabled: true,
		},
	})

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	gateway.TestGatewayObjectsDontExist(t, ctx, cl, managerName, ns)
}

func TestDeletesObjectsInMultiHost(t *testing.T) {
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
		},
		&v1alpha1.CheManager{
			ObjectMeta: metav1.ObjectMeta{
				Name:       managerName,
				Namespace:  ns,
				Finalizers: []string{FinalizerName},
			},
			Spec: v1alpha1.CheManagerSpec{
				GatewayHost:     "over.the.rainbow",
				GatewayDisabled: true,
			},
		})

	ctx := context.TODO()

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	gateway.TestGatewayObjectsDontExist(t, ctx, cl, managerName, ns)
}

func TestNoManagerSharedWhenReconcilingNonExistent(t *testing.T) {
	// clear the map before the test
	for k := range currentManagers {
		delete(currentManagers, k)
	}

	managerName := "che"
	ns := "default"
	scheme := createTestScheme()
	cl := fake.NewFakeClientWithScheme(scheme)

	ctx := context.TODO()

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	// there is nothing in our context, so the map should still be empty
	managers := GetCurrentManagers()
	if len(managers) != 0 {
		t.Fatalf("There should have been no managers after a reconcile of a non-existent manager.")
	}

	// now add some manager and reconcile a non-existent one
	cl.Create(ctx, &v1alpha1.CheManager{
		ObjectMeta: metav1.ObjectMeta{
			Name:       managerName + "-not-me",
			Namespace:  ns,
			Finalizers: []string{FinalizerName},
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost:     "over.the.rainbow",
			GatewayDisabled: true,
		},
	})

	_, err = reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	managers = GetCurrentManagers()
	if len(managers) != 0 {
		t.Fatalf("There should have been no managers after a reconcile of a non-existent manager.")
	}
}

func TestAddsManagerToSharedMapOnCreate(t *testing.T) {
	// clear the map before the test
	for k := range currentManagers {
		delete(currentManagers, k)
	}

	managerName := "che"
	ns := "default"
	scheme := createTestScheme()
	cl := fake.NewFakeClientWithScheme(scheme, &v1alpha1.CheManager{
		ObjectMeta: metav1.ObjectMeta{
			Name:       managerName,
			Namespace:  ns,
			Finalizers: []string{FinalizerName},
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost:     "over.the.rainbow",
			GatewayDisabled: true,
		},
	})

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	managers := GetCurrentManagers()
	if len(managers) != 1 {
		t.Fatalf("There should have been exactly 1 manager after a reconcile but there is %d.", len(managers))
	}

	mgr, ok := managers[types.NamespacedName{Name: managerName, Namespace: ns}]
	if !ok {
		t.Fatalf("The map of the current managers doesn't contain the expected one.")
	}

	if mgr.Name != managerName {
		t.Fatalf("Found a manager that we didn't reconcile. Curious (and buggy). We found %s but should have found %s", mgr.Name, managerName)
	}
}

func TestUpdatesManagerInSharedMapOnUpdate(t *testing.T) {
	// clear the map before the test
	for k := range currentManagers {
		delete(currentManagers, k)
	}

	managerName := "che"
	ns := "default"
	scheme := createTestScheme()

	cl := fake.NewFakeClientWithScheme(scheme, &v1alpha1.CheManager{
		ObjectMeta: metav1.ObjectMeta{
			Name:       managerName,
			Namespace:  ns,
			Finalizers: []string{FinalizerName},
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost:     "over.the.rainbow",
			GatewayDisabled: true,
		},
	})

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	managers := GetCurrentManagers()
	if len(managers) != 1 {
		t.Fatalf("There should have been exactly 1 manager after a reconcile but there is %d.", len(managers))
	}

	mgr, ok := managers[types.NamespacedName{Name: managerName, Namespace: ns}]
	if !ok {
		t.Fatalf("The map of the current managers doesn't contain the expected one.")
	}

	if mgr.Name != managerName {
		t.Fatalf("Found a manager that we didn't reconcile. Curious (and buggy). We found %s but should have found %s", mgr.Name, managerName)
	}

	if mgr.Spec.GatewayHost != "over.the.rainbow" {
		t.Fatalf("Unexpected host value: expected: over.the.rainbow, actual: %s", mgr.Spec.GatewayHost)
	}

	// now update the manager and reconcile again. See that the map contains the updated value
	mgr = *mgr.DeepCopy()
	mgr.Spec.GatewayHost = "over.the.shoulder"
	err = cl.Update(context.TODO(), &mgr)
	if err != nil {
		t.Fatalf("Failed to update. Wat? %s", err)
	}

	// before the reconcile, the map still should containe the old value
	managers = GetCurrentManagers()
	mgr, ok = managers[types.NamespacedName{Name: managerName, Namespace: ns}]
	if !ok {
		t.Fatalf("The map of the current managers doesn't contain the expected one.")
	}

	if mgr.Name != managerName {
		t.Fatalf("Found a manager that we didn't reconcile. Curious (and buggy). We found %s but should have found %s", mgr.Name, managerName)
	}

	if mgr.Spec.GatewayHost != "over.the.rainbow" {
		t.Fatalf("Unexpected host value: expected: over.the.rainbow, actual: %s", mgr.Spec.GatewayHost)
	}

	// now reconcile and see that the value in the map is now updated

	_, err = reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	managers = GetCurrentManagers()
	mgr, ok = managers[types.NamespacedName{Name: managerName, Namespace: ns}]
	if !ok {
		t.Fatalf("The map of the current managers doesn't contain the expected one.")
	}

	if mgr.Name != managerName {
		t.Fatalf("Found a manager that we didn't reconcile. Curious (and buggy). We found %s but should have found %s", mgr.Name, managerName)
	}

	if mgr.Spec.GatewayHost != "over.the.shoulder" {
		t.Fatalf("Unexpected host value: expected: over.the.shoulder, actual: %s", mgr.Spec.GatewayHost)
	}
}

func TestRemovesManagerFromSharedMapOnDelete(t *testing.T) {
	// clear the map before the test
	for k := range currentManagers {
		delete(currentManagers, k)
	}

	managerName := "che"
	ns := "default"
	scheme := createTestScheme()

	cl := fake.NewFakeClientWithScheme(scheme, &v1alpha1.CheManager{
		ObjectMeta: metav1.ObjectMeta{
			Name:       managerName,
			Namespace:  ns,
			Finalizers: []string{FinalizerName},
		},
		Spec: v1alpha1.CheManagerSpec{
			GatewayHost:     "over.the.rainbow",
			GatewayDisabled: true,
		},
	})

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	managers := GetCurrentManagers()
	if len(managers) != 1 {
		t.Fatalf("There should have been exactly 1 manager after a reconcile but there is %d.", len(managers))
	}

	mgr, ok := managers[types.NamespacedName{Name: managerName, Namespace: ns}]
	if !ok {
		t.Fatalf("The map of the current managers doesn't contain the expected one.")
	}

	if mgr.Name != managerName {
		t.Fatalf("Found a manager that we didn't reconcile. Curious (and buggy). We found %s but should have found %s", mgr.Name, managerName)
	}

	cl.Delete(context.TODO(), &mgr)

	// now reconcile and see that the value is no longer in the map

	_, err = reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	managers = GetCurrentManagers()
	_, ok = managers[types.NamespacedName{Name: managerName, Namespace: ns}]
	if ok {
		t.Fatalf("The map of the current managers should no longer contain the manager after it has been deleted.")
	}
}

func TestManagerFinalization(t *testing.T) {
	managerName := "che"
	ns := "default"
	scheme := createTestScheme()
	ctx := context.TODO()
	cl := fake.NewFakeClientWithScheme(scheme,
		&v1alpha1.CheManager{
			ObjectMeta: metav1.ObjectMeta{
				Name:       managerName,
				Namespace:  ns,
				Finalizers: []string{FinalizerName},
			},
			Spec: v1alpha1.CheManagerSpec{
				GatewayHost: "over.the.rainbow",
			},
		},
		&corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "ws1",
				Namespace: ns,
				Annotations: map[string]string{
					defaults.ConfigAnnotationCheManagerName:      managerName,
					defaults.ConfigAnnotationCheManagerNamespace: ns,
				},
				Labels: defaults.GetLabelsFromNames(managerName, "gateway-config"),
			},
		})

	reconciler := CheReconciler{client: cl, scheme: scheme, gateway: gateway.New(cl, scheme), syncer: sync.New(cl, scheme)}

	_, err := reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	// check that the reconcile loop added the finalizer
	manager := v1alpha1.CheManager{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &manager)
	if err != nil {
		t.Fatalf("Failed to obtain the manager from the fake client: %s", err)
	}

	if len(manager.Finalizers) != 1 {
		t.Fatalf("Expected a single finalizer on the manager but found: %d", len(manager.Finalizers))
	}

	if manager.Finalizers[0] != FinalizerName {
		t.Fatalf("Expected a finalizer called %s but got %s", FinalizerName, manager.Finalizers[0])
	}

	// try to delete the manager and check that the configmap disallows that and that the status of the manager is updated
	manager.DeletionTimestamp = &metav1.Time{Time: time.Now()}
	err = cl.Update(ctx, &manager)
	if err != nil {
		t.Fatalf("Failed to update the manager in the fake client: %s", err)
	}
	_, err = reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	manager = v1alpha1.CheManager{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &manager)
	if err != nil {
		t.Fatalf("Failed to obtain the manager from the fake client: %s", err)
	}

	if len(manager.Finalizers) != 1 {
		t.Fatalf("There should have been a finalizer on the manager after a failed finalization attempt")
	}

	if manager.Status.Phase != v1alpha1.ManagerPhasePendingDeletion {
		t.Fatalf("Expected the manager to be in the pending deletion phase but it is: %s", manager.Status.Phase)
	}
	if len(manager.Status.Message) == 0 {
		t.Fatalf("Expected an non-empty message about the failed finalization in the manager status")
	}

	// now remove the config map and check that the finalization proceeds
	err = cl.Delete(ctx, &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "ws1",
			Namespace: ns,
		},
	})
	if err != nil {
		t.Fatalf("Failed to delete the test configmap: %s", err)
	}

	_, err = reconciler.Reconcile(reconcile.Request{NamespacedName: types.NamespacedName{Name: managerName, Namespace: ns}})
	if err != nil {
		t.Fatalf("Failed to reconcile che manager with error: %s", err)
	}

	manager = v1alpha1.CheManager{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &manager)
	if err != nil {
		t.Fatalf("Failed to obtain the manager from the fake client: %s", err)
	}

	if len(manager.Finalizers) != 0 {
		t.Fatalf("The finalizers should be cleared after the finalization success but there were still some: %d", len(manager.Finalizers))
	}
}
