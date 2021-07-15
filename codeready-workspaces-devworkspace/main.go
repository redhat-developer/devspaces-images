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

package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"

	sysruntime "runtime"

	controllerv1alpha1 "github.com/devfile/devworkspace-operator/apis/controller/v1alpha1"
	"github.com/devfile/devworkspace-operator/controllers/controller/devworkspacerouting"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	extensions "k8s.io/api/extensions/v1beta1"
	rbac "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	"sigs.k8s.io/controller-runtime/pkg/manager"

	"github.com/che-incubator/devworkspace-che-operator/pkg/controller"
	"github.com/che-incubator/devworkspace-che-operator/pkg/solver"
	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	"github.com/eclipse-che/che-operator/pkg/apis"
	v1 "github.com/eclipse-che/che-operator/pkg/apis/org/v1"
	routev1 "github.com/openshift/api/route/v1"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
	memLog   = ctrl.Log.WithName("mem")
)

func init() {
	if err := infrastructure.Initialize(); err != nil {
		setupLog.Error(nil, "unable to detect the Kubernetes infrastructure type", "error", err)
		os.Exit(1)
	}

	utilruntime.Must(apis.AddToScheme(scheme))
	utilruntime.Must(controllerv1alpha1.AddToScheme(scheme))
	utilruntime.Must(extensions.AddToScheme(scheme))
	utilruntime.Must(corev1.AddToScheme(scheme))
	utilruntime.Must(appsv1.AddToScheme(scheme))
	utilruntime.Must(rbac.AddToScheme(scheme))

	if infrastructure.IsOpenShift() {
		utilruntime.Must(routev1.AddToScheme(scheme))
	}
}

func main() {

	var metricsAddr string
	var enableLeaderElection bool
	flag.StringVar(&metricsAddr, "metrics-addr", ":8080", "The address the metric endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "enable-leader-election", false,
		"Enable leader election for controller manager. "+
			"Enabling this will ensure there is only one active controller manager.")
	flag.Parse()

	ctrl.SetLogger(zap.New(zap.UseDevMode(true)))

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:             scheme,
		MetricsBindAddress: metricsAddr,
		Port:               9443,
		LeaderElection:     enableLeaderElection,
		LeaderElectionID:   "8d217f94.devfile.io",
	})

	if err != nil {
		setupLog.Error(err, "unable to start the operator manager")
		os.Exit(1)
	}

	debugMemUsage()

	cheReconciler := &controller.CheClusterReconciler{}
	if err = cheReconciler.SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Che")
		os.Exit(1)
	}

	routingReconciler := &devworkspacerouting.DevWorkspaceRoutingReconciler{
		Client:       mgr.GetClient(),
		Log:          ctrl.Log.WithName("controllers").WithName("DevWorkspaceRouting"),
		Scheme:       mgr.GetScheme(),
		SolverGetter: solver.Getter(scheme),
	}

	if err = routingReconciler.SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "CheDevWorkspaceRoutingSolver")
		os.Exit(1)
	}

	sigHandler := ctrl.SetupSignalHandler()

	if !waitForCRDsReady(mgr, sigHandler) {
		setupLog.Info("interrupted while waiting for CRDs to appear in the cluster")
		os.Exit(1)
	}

	setupLog.Info("starting manager")
	if err := mgr.Start(sigHandler); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}

// Instead of waiting for the CRDs to appear in the cluster explicitly, we could have just tried to start
// the controller manager in a loop until it succeeds. Alas, that is not possible because the controller-runtime
// we're using is rather buggy and does not really support restarts (it does not stop the metrics and leader election
// servers and therefore fails on the next try). We could revisit this when we upgrade controller-runtime to
// something newer than 0.4.0 that we're currently using.
//
// For now, let's just use this simple method for making sure the cluster has everything we need for the correct
// operation before we actually start the controller manager.
func waitForCRDsReady(mgr manager.Manager, stop <-chan struct{}) bool {
	// the CRD types we need to check for existence
	objs := map[runtime.Object]runtime.Object{
		&v1.CheCluster{}: &v1.CheClusterList{},
		&controllerv1alpha1.DevWorkspaceRouting{}: &controllerv1alpha1.DevWorkspaceRoutingList{},
	}

	// we need to make sure the cluster has the CRDs we expect. We must not hard fail when they're missing because
	// we're co-deployed with the che-operator and us exiting would mean constant restarts of the whole deployment.
	// Che-operator is in charge of deploying the CRDs on demand at some point during runtime so we need to
	// let it do its job and wait patiently.
	check := func() ([]string, bool) {
		// we re-create the client in each check to prevent caching
		cl, err := client.New(mgr.GetConfig(), client.Options{Scheme: scheme})
		if err != nil {
			setupLog.Error(err, "failed to construct k8s client")
			return []string{}, false
		}

		missingTypes := []string{}

		for ot, os := range objs {
			err := cl.List(context.TODO(), os)
			switch err.(type) {
			case *meta.NoKindMatchError:
				missingTypes = append(missingTypes, fmt.Sprintf("%T", ot))
			}
		}

		return missingTypes, len(missingTypes) == 0
	}

	missingTypes, success := check()
	if success {
		return true
	} else {
		setupLog.Info("waiting until all CRDs are installed", "missing", missingTypes)
	}

	for {
		select {
		case <-stop:
			return false
		case <-time.After(time.Duration(30) * time.Second):
			// don't spam the log every time we check. The first time was enough...
			_, success = check()
			if success {
				return true
			}
		}
	}
}

// If we get OOMs from kubernetes, it might be useful to see what activity causes the memory usage spikes in
// the operator. This just prints basic mem usage stats to the log in a configurable interval.
func debugMemUsage() {
	val, err := strconv.Atoi(os.Getenv("DEBUG_PRINT_MEMORY_INTERVAL"))
	if err != nil {
		return
	}

	go func() {
		ticker := time.NewTicker(time.Duration(val) * time.Millisecond)

		for range ticker.C {
			var m sysruntime.MemStats
			sysruntime.ReadMemStats(&m)
			memLog.Info("stats", "alloc", m.Alloc, "sys", m.Sys, "gcs", m.NumGC)
		}
	}()
}
