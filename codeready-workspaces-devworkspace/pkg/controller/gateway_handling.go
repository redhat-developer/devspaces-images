package controller

import (
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/labels"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/eclipse-che/che-operator/pkg/apis/org/v2alpha1"
)

// Reconciles the gateway - syncs it with the cluster if gateway is enabled in the manager, other deletes it.
// Returns true if gateway deployment is changed, the host on which it is deployed (if so), and error (if any).
func (r *CheClusterReconciler) gatewayReconcile(ctx context.Context, cluster *v2alpha1.CheCluster) (bool, string, error) {
	var changed bool
	var err error
	var host string

	if !cluster.Spec.Gateway.IsEnabled() {
		changed, host, err = true, "", r.gateway.Delete(ctx, cluster)
	} else {
		changed, host, err = r.gateway.Sync(ctx, cluster)
	}

	return changed, host, err
}

// Checks that there are no devworkspace configurations for the gateway (which would mean running devworkspaces).
// If there are some, an error is returned.
func (r *CheClusterReconciler) gatewayConfigFinalize(ctx context.Context, cluster *v2alpha1.CheCluster) error {
	// we need to stop the reconcile if there are devworkspaces handled by it.
	// we detect that by the presence of the gateway configmaps in the namespace of the manager
	list := corev1.ConfigMapList{}

	err := r.client.List(ctx, &list, &client.ListOptions{
		Namespace:     cluster.Namespace,
		LabelSelector: labels.SelectorFromSet(defaults.GetLabelsForComponent(cluster, "gateway-config")),
	})
	if err != nil {
		return err
	}

	workspaceCount := 0

	for _, c := range list.Items {
		if c.Annotations[defaults.ConfigAnnotationCheManagerName] == cluster.Name && c.Annotations[defaults.ConfigAnnotationCheManagerNamespace] == cluster.Namespace {
			workspaceCount++
		}
	}

	if workspaceCount > 0 {
		return fmt.Errorf("there are %d devworkspaces associated with this Che manager", workspaceCount)
	}

	return nil
}
