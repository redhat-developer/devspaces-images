//
// Copyright (c) 2020-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package gateway

import (
	"context"

	"github.com/che-incubator/devworkspace-che-operator/apis/che-controller/v1alpha1"
	"github.com/che-incubator/devworkspace-che-operator/pkg/defaults"
	"github.com/che-incubator/devworkspace-che-operator/pkg/sync"
	"github.com/devfile/devworkspace-operator/pkg/infrastructure"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	serviceAccountDiffOpts = cmpopts.IgnoreFields(corev1.ServiceAccount{}, "TypeMeta", "ObjectMeta", "Secrets", "ImagePullSecrets")
	roleDiffOpts           = cmpopts.IgnoreFields(rbac.Role{}, "TypeMeta", "ObjectMeta")
	roleBindingDiffOpts    = cmpopts.IgnoreFields(rbac.RoleBinding{}, "TypeMeta", "ObjectMeta")
	serviceDiffOpts        = cmp.Options{
		cmpopts.IgnoreFields(corev1.Service{}, "TypeMeta", "ObjectMeta", "Status"),
		cmpopts.IgnoreFields(corev1.ServiceSpec{}, "ClusterIP"),
	}
	configMapDiffOpts  = cmpopts.IgnoreFields(corev1.ConfigMap{}, "TypeMeta", "ObjectMeta")
	deploymentDiffOpts = cmp.Options{
		cmpopts.IgnoreFields(appsv1.Deployment{}, "TypeMeta", "ObjectMeta", "Status"),
		cmpopts.IgnoreFields(appsv1.DeploymentSpec{}, "Replicas", "RevisionHistoryLimit", "ProgressDeadlineSeconds"),
		cmpopts.IgnoreFields(appsv1.DeploymentStrategy{}, "RollingUpdate"),
		cmpopts.IgnoreFields(corev1.Container{}, "TerminationMessagePath", "TerminationMessagePolicy"),
		cmpopts.IgnoreFields(corev1.PodSpec{}, "DNSPolicy", "SchedulerName", "SecurityContext", "DeprecatedServiceAccount"),
		cmpopts.IgnoreFields(corev1.ConfigMapVolumeSource{}, "DefaultMode"),
		cmpopts.IgnoreFields(corev1.VolumeSource{}, "EmptyDir"),
		cmp.Comparer(func(x, y resource.Quantity) bool {
			return x.Cmp(y) == 0
		}),
	}

	GatewayPort       = 8080
	GatewaySecurePort = 8443
)

type CheGateway struct {
	client client.Client
	scheme *runtime.Scheme
}

func New(client client.Client, scheme *runtime.Scheme) CheGateway {
	return CheGateway{
		client: client,
		scheme: scheme,
	}
}

func (g *CheGateway) Sync(ctx context.Context, manager *v1alpha1.CheManager) (bool, string, error) {

	syncer := sync.New(g.client, g.scheme)

	var ret, partial bool
	var err error

	sa := getGatewayServiceAccountSpec(manager)
	if partial, _, err = syncer.Sync(ctx, manager, &sa, serviceAccountDiffOpts); err != nil {
		return false, "", err
	}
	ret = ret || partial

	role := getGatewayRoleSpec(manager)
	if partial, _, err = syncer.Sync(ctx, manager, &role, roleDiffOpts); err != nil {
		return false, "", err
	}
	ret = ret || partial

	roleBinding := getGatewayRoleBindingSpec(manager)
	if partial, _, err = syncer.Sync(ctx, manager, &roleBinding, roleBindingDiffOpts); err != nil {
		return false, "", err
	}
	ret = ret || partial

	traefikConfig := getGatewayTraefikConfigSpec(manager)
	if partial, _, err = syncer.Sync(ctx, manager, &traefikConfig, configMapDiffOpts); err != nil {
		return false, "", err
	}
	ret = ret || partial

	depl := getGatewayDeploymentSpec(manager)
	if partial, _, err = syncer.Sync(ctx, manager, &depl, deploymentDiffOpts); err != nil {
		return false, "", err
	}
	ret = ret || partial

	service := getGatewayServiceSpec(manager)
	if partial, _, err = syncer.Sync(ctx, manager, &service, serviceDiffOpts); err != nil {
		return false, "", err
	}
	ret = ret || partial

	var host string

	if infrastructure.IsOpenShift() {
		if partial, host, err = g.reconcileRoute(syncer, ctx, manager); err != nil {
			return false, "", err
		}
		ret = ret || partial
	} else {
		if partial, host, err = g.reconcileIngress(syncer, ctx, manager); err != nil {
			return false, "", err
		}
		ret = ret || partial
	}

	return ret, host, nil
}

func GetGatewayServiceName(manager *v1alpha1.CheManager) string {
	return manager.Name
}

func (g *CheGateway) Delete(ctx context.Context, manager *v1alpha1.CheManager) error {
	syncer := sync.New(g.client, g.scheme)

	deployment := appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
		},
	}
	if err := syncer.Delete(ctx, &deployment); err != nil {
		return err
	}

	serverConfig := corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
		},
	}
	if err := syncer.Delete(ctx, &serverConfig); err != nil {
		return err
	}

	roleBinding := rbac.RoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
		},
	}
	if err := syncer.Delete(ctx, &roleBinding); err != nil {
		return err
	}

	role := rbac.Role{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
		},
	}
	if err := syncer.Delete(ctx, &role); err != nil {
		return err
	}

	sa := corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
		},
	}
	if err := syncer.Delete(ctx, &sa); err != nil {
		return err
	}

	service := corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
		},
	}
	if err := syncer.Delete(ctx, &service); err != nil {
		return err
	}

	return nil
}

// below functions declare the desired states of the various objects required for the gateway

func getGatewayServiceAccountSpec(manager *v1alpha1.CheManager) corev1.ServiceAccount {
	return corev1.ServiceAccount{
		TypeMeta: metav1.TypeMeta{
			APIVersion: corev1.SchemeGroupVersion.String(),
			Kind:       "ServiceAccount",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "security"),
		},
	}
}

func getGatewayRoleSpec(manager *v1alpha1.CheManager) rbac.Role {
	return rbac.Role{
		TypeMeta: metav1.TypeMeta{
			APIVersion: rbac.SchemeGroupVersion.String(),
			Kind:       "Role",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "security"),
		},
		Rules: []rbac.PolicyRule{
			{
				Verbs:     []string{"watch", "get", "list"},
				APIGroups: []string{""},
				Resources: []string{"configmaps"},
			},
		},
	}
}

func getGatewayRoleBindingSpec(manager *v1alpha1.CheManager) rbac.RoleBinding {
	return rbac.RoleBinding{
		TypeMeta: metav1.TypeMeta{
			APIVersion: rbac.SchemeGroupVersion.String(),
			Kind:       "RoleBinding",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "security"),
		},
		RoleRef: rbac.RoleRef{
			APIGroup: "rbac.authorization.k8s.io",
			Kind:     "Role",
			Name:     manager.Name,
		},
		Subjects: []rbac.Subject{
			{
				Kind: "ServiceAccount",
				Name: manager.Name,
			},
		},
	}
}

func getGatewayTraefikConfigSpec(manager *v1alpha1.CheManager) corev1.ConfigMap {
	return corev1.ConfigMap{
		TypeMeta: metav1.TypeMeta{
			APIVersion: corev1.SchemeGroupVersion.String(),
			Kind:       "ConfigMap",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "gateway-config"),
		},
		Data: map[string]string{
			"traefik.yml": `
entrypoints:
  http:
    address: ":8080"
    forwardedHeaders:
      insecure: true
  https:
    address: ":8443"
    forwardedHeaders:
      insecure: true
global:
  checkNewVersion: false
  sendAnonymousUsage: false
providers:
  file:
    directory: "/dynamic-config"
    watch: true
log:
  level: "INFO"`,
		},
	}
}

func getGatewayDeploymentSpec(manager *v1alpha1.CheManager) appsv1.Deployment {
	gatewayImage := defaults.GetGatewayImage()
	sidecarImage := defaults.GetGatewayConfigurerImage()

	terminationGracePeriodSeconds := int64(10)

	return appsv1.Deployment{
		TypeMeta: metav1.TypeMeta{
			APIVersion: appsv1.SchemeGroupVersion.String(),
			Kind:       "Deployment",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      manager.Name,
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "deployment"),
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: defaults.GetLabelsForComponent(manager, "deployment"),
			},
			Strategy: appsv1.DeploymentStrategy{
				Type: appsv1.RollingUpdateDeploymentStrategyType,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: defaults.GetLabelsForComponent(manager, "deployment"),
				},
				Spec: corev1.PodSpec{
					TerminationGracePeriodSeconds: &terminationGracePeriodSeconds,
					ServiceAccountName:            manager.Name,
					RestartPolicy:                 corev1.RestartPolicyAlways,
					Containers: []corev1.Container{
						{
							Name:            "gateway",
							Image:           gatewayImage,
							ImagePullPolicy: corev1.PullAlways,
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "static-config",
									MountPath: "/etc/traefik",
								},
								{
									Name:      "dynamic-config",
									MountPath: "/dynamic-config",
								},
							},
						},
						{
							Name:            "configbump",
							Image:           sidecarImage,
							ImagePullPolicy: corev1.PullAlways,
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "dynamic-config",
									MountPath: "/dynamic-config",
								},
							},
							Env: []corev1.EnvVar{
								{
									Name:  "CONFIG_BUMP_DIR",
									Value: "/dynamic-config",
								},
								{
									Name:  "CONFIG_BUMP_LABELS",
									Value: labels.FormatLabels(defaults.GetLabelsForComponent(manager, "gateway-config")),
								},
								{
									Name: "CONFIG_BUMP_NAMESPACE",
									ValueFrom: &corev1.EnvVarSource{
										FieldRef: &corev1.ObjectFieldSelector{
											APIVersion: "v1",
											FieldPath:  "metadata.namespace",
										},
									},
								},
							},
						},
					},
					Volumes: []corev1.Volume{
						{
							Name: "static-config",
							VolumeSource: corev1.VolumeSource{
								ConfigMap: &corev1.ConfigMapVolumeSource{
									LocalObjectReference: corev1.LocalObjectReference{
										Name: manager.Name,
									},
								},
							},
						},
						{
							Name: "dynamic-config",
							VolumeSource: corev1.VolumeSource{
								EmptyDir: &corev1.EmptyDirVolumeSource{},
							},
						},
					},
				},
			},
		},
	}
}

func getGatewayServiceSpec(manager *v1alpha1.CheManager) corev1.Service {
	return corev1.Service{
		TypeMeta: metav1.TypeMeta{
			APIVersion: corev1.SchemeGroupVersion.String(),
			Kind:       "Service",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      GetGatewayServiceName(manager),
			Namespace: manager.Namespace,
			Labels:    defaults.GetLabelsForComponent(manager, "deployment"),
		},
		Spec: corev1.ServiceSpec{
			Selector:        defaults.GetLabelsForComponent(manager, "deployment"),
			SessionAffinity: corev1.ServiceAffinityNone,
			Type:            corev1.ServiceTypeClusterIP,
			Ports: []corev1.ServicePort{
				{
					Name:       "gateway-http",
					Port:       int32(GatewayPort),
					Protocol:   corev1.ProtocolTCP,
					TargetPort: intstr.FromInt(GatewayPort),
				},
				{
					Name:       "gateway-https",
					Port:       int32(GatewaySecurePort),
					Protocol:   corev1.ProtocolTCP,
					TargetPort: intstr.FromInt(GatewaySecurePort),
				},
			},
		},
	}
}
