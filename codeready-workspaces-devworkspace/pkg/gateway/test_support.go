package gateway

import (
	"context"
	"testing"

	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	rbac "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func AssertGatewayObjectsExist(t *testing.T, ctx context.Context, cl client.Client, managerName string, ns string) {
	sa := corev1.ServiceAccount{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &sa); err != nil {
		t.Errorf("Failed to get a service account called '%s': %s", managerName, err)
	} else if sa.Name != managerName {
		t.Errorf("There should be a service account called '%s'", managerName)
	}

	role := rbac.Role{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &role); err != nil {
		t.Errorf("Failed to get a role called '%s': %s", managerName, err)
	} else if role.Name != managerName {
		t.Errorf("There should be a role called '%s'", managerName)
	}

	rb := rbac.RoleBinding{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &rb); err != nil {
		t.Errorf("Failed to get a role binding called '%s': %s", managerName, err)
	} else if rb.Name != managerName {
		t.Errorf("There should be a role binding called '%s'", managerName)
	}

	cm := corev1.ConfigMap{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &cm); err != nil {
		t.Errorf("Failed to get a configmap called '%s': %s", managerName, err)
	} else if cm.Name != managerName {
		t.Errorf("There should a configmap called '%s'", managerName)
	}

	depl := appsv1.Deployment{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &depl); err != nil {
		t.Errorf("Failed to get a deployment called '%s': %s", managerName, err)
	} else if depl.Name != managerName {
		t.Error("There should be a deployment for the gateway")
	}

	service := corev1.Service{}
	if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &service); err != nil {
		t.Errorf("Failed to get a service called '%s': %s", managerName, err)
	} else if service.Name != managerName {
		t.Error("There should be a service for the gateway")
	}

	if infrastructure.IsOpenShift() {
		route := routev1.Route{}
		if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &route); err != nil {
			t.Errorf("Failed to get a route called '%s': %s", managerName, err)
		}
	} else {
		ingress := v1beta1.Ingress{}
		if err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &ingress); err != nil {
			t.Errorf("Failed to get an ingress called '%s': %s", managerName, err)
		}
	}
}

func AssertGatewayObjectsDontExist(t *testing.T, ctx context.Context, cl client.Client, managerName string, ns string) {
	depl := &appsv1.Deployment{}
	err := cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, depl)
	if !errors.IsNotFound(err) {
		t.Errorf("Expected to not find the gateway deployment but the error we got was unexpected: %s", err)
	}

	cm := &corev1.ConfigMap{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, cm)
	if !errors.IsNotFound(err) {
		t.Errorf("Expected to not find the gateway configmap but the error we got was unexpected: %s", err)
	}

	rb := &rbac.RoleBinding{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, rb)
	if !errors.IsNotFound(err) {
		t.Errorf("Expected to not find the gateway role binding but the error we got was unexpected: %s", err)
	}

	role := &rbac.Role{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, role)
	if !errors.IsNotFound(err) {
		t.Errorf("Expected to not find the gateway role but the error we got was unexpected: %s", err)
	}

	sa := &corev1.ServiceAccount{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, sa)
	if !errors.IsNotFound(err) {
		t.Errorf("Expected to not find the gateway service account but the error we got was unexpected: %s", err)
	}

	service := &corev1.Service{}
	err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, service)
	if !errors.IsNotFound(err) {
		t.Errorf("Expected to not find the gateway service but the error we got was unexpected: %s", err)
	}

	if infrastructure.IsOpenShift() {
		route := routev1.Route{}
		err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &route)
		if !errors.IsNotFound(err) {
			t.Errorf("Expected to not find the gateway route but the error we got was unexpected: %s", err)
		}
	} else {
		ingress := v1beta1.Ingress{}
		err = cl.Get(ctx, client.ObjectKey{Name: managerName, Namespace: ns}, &ingress)
		if !errors.IsNotFound(err) {
			t.Errorf("Expected to not find the gateway ingress but the error we got was unexpected: %s", err)
		}
	}
}
