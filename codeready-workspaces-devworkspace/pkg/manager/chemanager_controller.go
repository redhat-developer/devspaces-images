//
// Copyright (c) 2019-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package manager

import (
	"context"
	stdErrors "errors"
	"fmt"
	"sync"

	"github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	"github.com/che-incubator/devworkspace-che-operator/pkg/gateway"
	datasync "github.com/che-incubator/devworkspace-che-operator/pkg/sync"
	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/extensions/v1beta1"
	rbac "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	log             = ctrl.Log.WithName("che")
	currentManagers = map[client.ObjectKey]v1alpha1.CheManager{}
	managerAccess   = sync.Mutex{}
)

const (
	// FinalizerName is the name of the finalizer put on the Che Manager resources by the controller. Public for testing purposes.
	FinalizerName = "chemanager.che.eclipse.org"
)

type CheReconciler struct {
	client  client.Client
	scheme  *runtime.Scheme
	gateway gateway.CheGateway
	syncer  datasync.Syncer
}

// GetCurrentManagers returns a map of all che managers (keyed by their namespaced name)
// the the che manager controller currently knows of. This returns any meaningful data
// only after reconciliation has taken place.
//
// If this method is called from another controller, it effectively couples that controller
// with the che manager controller. Such controller will therefore have to run in the same
// process as the che manager controller. On the other hand, using this method, and somehow
// tolerating its eventual consistency, makes the other controller more efficient such that
// it doesn't have to find the che managers in the cluster (which is what che manager reconciler
// is doing).
//
// If need be, this method can be replaced by a simply calling client.List to get all the che
// managers in the cluster.
func GetCurrentManagers() map[client.ObjectKey]v1alpha1.CheManager {
	managerAccess.Lock()
	defer managerAccess.Unlock()

	ret := map[client.ObjectKey]v1alpha1.CheManager{}

	for k, v := range currentManagers {
		ret[k] = v
	}

	return ret
}

// New returns a new instance of the Che manager reconciler. This is mainly useful for
// testing because it doesn't set up any watches in the cluster, etc. For that use SetupWithManager.
func New(cl client.Client, scheme *runtime.Scheme) CheReconciler {
	return CheReconciler{
		client:  cl,
		scheme:  scheme,
		gateway: gateway.New(cl, scheme),
		syncer:  datasync.New(cl, scheme),
	}
}

func (r *CheReconciler) SetupWithManager(mgr ctrl.Manager) error {
	r.client = mgr.GetClient()
	r.scheme = mgr.GetScheme()
	r.gateway = gateway.New(mgr.GetClient(), mgr.GetScheme())
	r.syncer = datasync.New(r.client, r.scheme)

	bld := ctrl.NewControllerManagedBy(mgr).
		For(&v1alpha1.CheManager{}).
		Owns(&corev1.Service{}).
		Owns(&v1beta1.Ingress{}).
		Owns(&corev1.ConfigMap{}).
		Owns(&appsv1.Deployment{}).
		Owns(&corev1.Pod{}).
		Owns(&corev1.ServiceAccount{}).
		Owns(&rbac.Role{}).
		Owns(&rbac.RoleBinding{})
	if infrastructure.IsOpenShift() {
		bld.Owns(&routev1.Route{})
	}
	return bld.Complete(r)
}

func (r *CheReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()

	managerAccess.Lock()
	defer managerAccess.Unlock()

	// remove the manager from the shared map for the time of the reconciliation
	// we'll add it back if it is successfully reconciled.
	// The access to the map is locked for the time of reconciliation so that outside
	// callers don't witness this intermediate state.
	delete(currentManagers, req.NamespacedName)

	// make sure we've checked we're in a valid state
	current := &v1alpha1.CheManager{}
	err := r.client.Get(ctx, req.NamespacedName, current)
	if err != nil {
		if errors.IsNotFound(err) {
			// Ok, our current router disappeared...
			return ctrl.Result{}, nil
		}
		// other error - let's requeue
		return ctrl.Result{}, err
	}

	if current.GetDeletionTimestamp() != nil {
		return ctrl.Result{}, r.finalize(ctx, current)
	}

	finalizerUpdated, err := r.ensureFinalizer(ctx, current)
	if err != nil {
		log.Info("Failed to set a finalizer on %s", req.String())
		return ctrl.Result{}, err
	} else if finalizerUpdated {
		// we've updated the object with a new finalizer, so we will enter another reconciliation loop shortly
		// we don't add the manager into the shared map just yet, because we have actually not reconciled it fully.
		return ctrl.Result{}, nil
	}

	// validate the CR
	err = r.validate(current)
	if err != nil {
		log.Info("validation errors", "errors", err.Error())
		res, err := r.updateStatus(ctx, current, nil, "", v1alpha1.ManagerPhaseInactive, err.Error())
		if err != nil {
			return res, err
		}

		return res, nil
	}

	// now, finally, the actual reconciliation
	var changed bool
	var host string

	if changed, host, err = r.gatewayReconcile(ctx, current); err != nil {
		return ctrl.Result{}, err
	}

	res, err := r.updateStatus(ctx, current, &changed, host, v1alpha1.ManagerPhaseActive, "")

	if err != nil {
		return res, err
	}

	// everything went fine and the manager exists, put it back in the shared map
	currentManagers[req.NamespacedName] = *current

	return res, nil
}

func (r *CheReconciler) updateStatus(ctx context.Context, manager *v1alpha1.CheManager, changed *bool, host string, phase v1alpha1.ManagerPhase, phaseMessage string) (ctrl.Result, error) {
	currentPhase := manager.Status.GatewayPhase
	currentHost := manager.Status.GatewayHost

	if changed != nil {
		if manager.Spec.GatewayDisabled {
			manager.Status.GatewayPhase = v1alpha1.GatewayPhaseInactive
		} else if *changed {
			manager.Status.GatewayPhase = v1alpha1.GatewayPhaseInitializing
		} else {
			manager.Status.GatewayPhase = v1alpha1.GatewayPhaseEstablished
		}
	}

	manager.Status.GatewayHost = host

	// set this unconditionally, because the only other value is set using the finalizer
	manager.Status.Phase = phase
	manager.Status.Message = phaseMessage

	if currentPhase != manager.Status.GatewayPhase || currentHost != manager.Status.GatewayHost {
		return ctrl.Result{Requeue: true}, r.client.Status().Update(ctx, manager)
	}

	return ctrl.Result{Requeue: currentPhase == v1alpha1.GatewayPhaseInitializing || manager.Status.Phase != v1alpha1.ManagerPhaseActive}, nil
}

func (r *CheReconciler) validate(manager *v1alpha1.CheManager) error {
	validationErrors := []string{}

	if !infrastructure.IsOpenShift() {
		if manager.Spec.GatewayHost == "" {
			validationErrors = append(validationErrors, "gatewayHost must be specified")
		}
	}

	if len(validationErrors) > 0 {
		message := "The following validation errors were detected:\n"
		for _, m := range validationErrors {
			message += "- " + m + "\n"
		}

		return stdErrors.New(message)
	}

	return nil
}

func (r *CheReconciler) finalize(ctx context.Context, mgr *v1alpha1.CheManager) (err error) {
	err = r.gatewayConfigFinalize(ctx, mgr)

	if err == nil {
		finalizers := []string{}
		for i := range mgr.Finalizers {
			if mgr.Finalizers[i] != FinalizerName {
				finalizers = append(finalizers, mgr.Finalizers[i])
			}
		}

		mgr.Finalizers = finalizers

		err = r.client.Update(ctx, mgr)
	} else {
		mgr.Status.Phase = v1alpha1.ManagerPhasePendingDeletion
		mgr.Status.Message = fmt.Sprintf("Finalization has failed: %s", err.Error())
		err = r.client.Status().Update(ctx, mgr)
	}

	return err
}

func (r *CheReconciler) ensureFinalizer(ctx context.Context, manager *v1alpha1.CheManager) (updated bool, err error) {

	needsUpdate := true
	if manager.Finalizers != nil {
		for i := range manager.Finalizers {
			if manager.Finalizers[i] == FinalizerName {
				needsUpdate = false
				break
			}
		}
	} else {
		manager.Finalizers = []string{}
	}

	if needsUpdate {
		manager.Finalizers = append(manager.Finalizers, FinalizerName)
		err = r.client.Update(ctx, manager)
	}

	return needsUpdate, err
}
