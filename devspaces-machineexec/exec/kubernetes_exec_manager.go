//
// Copyright (c) 2019-2021 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package exec

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"

	"github.com/sirupsen/logrus"

	"github.com/eclipse-che/che-machine-exec/api/model"
	"github.com/eclipse-che/che-machine-exec/client"
	exec_info "github.com/eclipse-che/che-machine-exec/exec-info"
	"github.com/eclipse-che/che-machine-exec/filter"
	"github.com/eclipse-che/che-machine-exec/kubeconfig"
	line_buffer "github.com/eclipse-che/che-machine-exec/output/line-buffer"
	"github.com/eclipse-che/che-machine-exec/output/utf8stream"
	ws "github.com/eclipse-che/che-machine-exec/ws-conn"
	"github.com/gorilla/websocket"
	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/tools/remotecommand"
)

type machineExecs struct {
	mutex   *sync.Mutex
	execMap map[int]*model.MachineExec
}

// KubernetesExecManager manipulate kubernetes container execs.
type KubernetesExecManager struct {
	k8sAPIProvider client.K8sAPIProvider

	namespace string
}

var (
	execs = machineExecs{
		mutex:   &sync.Mutex{},
		execMap: make(map[int]*model.MachineExec),
	}
	prevExecID uint64 = 0
)

// Newk8sExecManager create new instance of the kubernetes exec manager.
func NewK8sExecManager(
	namespace string,
	clientProvider client.K8sAPIProvider,
) *KubernetesExecManager {
	return &KubernetesExecManager{
		namespace:      namespace,
		k8sAPIProvider: clientProvider,
	}
}

func (manager *KubernetesExecManager) Resolve(container, token string) (*model.ResolvedExec, error) {
	machineExec := &model.MachineExec{
		BearerToken: token,
	}
	k8sAPI, err := manager.k8sAPIProvider.GetK8sAPI(machineExec)
	if err != nil {
		logrus.Debugf("Unable to get k8sAPI %s", err.Error())
		return nil, err
	}
	logrus.Debug("Successfully Got k8sApi object.")

	if container != "" {
		containerFilter := filter.NewKubernetesContainerFilter(manager.namespace, k8sAPI.GetClient().CoreV1())
		containerInfo, err := containerFilter.GetContainer(container)
		if err != nil {
			return nil, err
		}
		cmdResolver := NewCmdResolver(k8sAPI, manager.namespace)
		resolvedCmd, err := cmdResolver.ResolveCmd(*machineExec, containerInfo)

		if err != nil {
			return nil, err
		}

		logrus.Printf("%s is successfully resolved in auto discovered container %s/%s", resolvedCmd,
			containerInfo.PodName, containerInfo.ContainerName)
		return &model.ResolvedExec{
			ContainerInfo: *containerInfo,
			Cmd:           resolvedCmd,
		}, nil
	} else {
		return manager.findFirstAvailable(k8sAPI, machineExec)
	}
}

//TODO Try to refactor it in the way to be able to reuse it in manager.Create
func (manager *KubernetesExecManager) findFirstAvailable(k8sAPI *client.K8sAPI, machineExec *model.MachineExec) (*model.ResolvedExec, error) {
	containerFilter := filter.NewKubernetesContainerFilter(manager.namespace, k8sAPI.GetClient().CoreV1())
	// connect to the first available container. Workaround for Cloud Shell https://github.com/eclipse/che/issues/15434
	containersInfo, err := containerFilter.GetContainerList()
	if err != nil {
		return nil, err
	}

	if len(containersInfo) == 0 {
		return nil, errors.New("no containers found to exec")
	}

	errs := make(map[string]error)
	for _, containerInfo := range containersInfo {
		cmdResolver := NewCmdResolver(k8sAPI, manager.namespace)
		resolvedCmd, err := cmdResolver.ResolveCmd(*machineExec, containerInfo)
		if err != nil {
			errs[containerInfo.ContainerName] = err
			continue
		}

		logrus.Printf("%s is successfully resolved in auto discovered container %s/%s", resolvedCmd,
			containerInfo.PodName, containerInfo.ContainerName)
		return &model.ResolvedExec{
			ContainerInfo: *containerInfo,
			Cmd:           resolvedCmd,
		}, nil
	}

	var containers []string
	for _, c := range containersInfo {
		containers = append(containers, c.PodName+"\\"+c.ContainerName)
	}
	var buf strings.Builder
	for container, err := range errs {
		buf.WriteString(fmt.Sprintf("- %s: %s\n", container, err.Error()))
	}
	return nil, fmt.Errorf("failed to resolve exec in any of {%s} -- errors: \n%s", strings.Join(containers, ", "), buf.String())
}

// Create new exec request object
func (manager *KubernetesExecManager) Create(machineExec *model.MachineExec) (int, error) {
	k8sAPI, err := manager.k8sAPIProvider.GetK8sAPI(machineExec)
	if err != nil {
		logrus.Debugf("Unable to get k8sAPI %s", err.Error())
		return -1, err
	}
	logrus.Debug("Successfully Got k8sApi object.")

	containerFilter := filter.NewKubernetesContainerFilter(manager.namespace, k8sAPI.GetClient().CoreV1())

	if machineExec.Identifier.MachineName != "" {
		containerInfo, err := containerFilter.FindContainerInfo(&machineExec.Identifier)
		if err != nil {
			return -1, err
		}
		if err = manager.doCreate(machineExec, containerInfo, k8sAPI); err != nil {
			return -1, err
		}
		logrus.Printf("%s is successfully initialized in user specified container %s/%s", machineExec.Cmd,
			containerInfo.PodName, containerInfo.ContainerName)
		return machineExec.ID, nil
	}
	// connect to the first available container. Workaround for Cloud Shell https://github.com/eclipse/che/issues/15434
	containersInfo, err := containerFilter.GetContainerList()
	if err != nil {
		return -1, err
	}

	if len(containersInfo) == 0 {
		return -1, errors.New("no containers found to exec")
	}

	errs := make(map[string]error)
	for _, containerInfo := range containersInfo {
		err = manager.doCreate(machineExec, containerInfo, k8sAPI)
		if err != nil {
			//attempt to initialize terminal in this container failed
			//proceed to next one
			errs[containerInfo.ContainerName] = err
			continue
		}
		logrus.Printf("%s is successfully initialized in auto discovered container %s/%s", machineExec.Cmd,
			containerInfo.PodName, containerInfo.ContainerName)
		return machineExec.ID, nil
	}

	var containers []string
	for _, c := range containersInfo {
		containers = append(containers, c.PodName+"\\"+c.ContainerName)
	}
	var buf strings.Builder
	for container, err := range errs {
		buf.WriteString(fmt.Sprintf("- %s: %s\n", container, err.Error()))
	}
	return -1, fmt.Errorf("failed to initialize terminal in any of {%s} -- errors: \n%s", strings.Join(containers, ", "), buf.String())
}

func (manager *KubernetesExecManager) doCreate(machineExec *model.MachineExec, containerInfo *model.ContainerInfo, k8sAPI *client.K8sAPI) error {
	cmdResolver := NewCmdResolver(k8sAPI, manager.namespace)
	resolvedCmd, err := cmdResolver.ResolveCmd(*machineExec, containerInfo)
	if err != nil {
		return err
	}

	req := k8sAPI.GetClient().CoreV1().RESTClient().
		Post().
		Namespace(manager.namespace).
		Resource(exec_info.Pods).
		Name(containerInfo.PodName).
		SubResource(exec_info.Exec).
		// set up params
		VersionedParams(&v1.PodExecOptions{
			Container: containerInfo.ContainerName,
			Command:   resolvedCmd,
			Stdout:    true,
			Stderr:    true,
			Stdin:     true,
			TTY:       machineExec.Tty,
		}, scheme.ParameterCodec)

	executor, err := remotecommand.NewSPDYExecutor(k8sAPI.GetConfig(), exec_info.Post, req.URL())
	if err != nil {
		return err
	}
	machineExec.Cmd = resolvedCmd

	defer execs.mutex.Unlock()
	execs.mutex.Lock()

	machineExec.Executor = executor
	machineExec.ID = int(atomic.AddUint64(&prevExecID, 1))
	machineExec.MsgChan = make(chan []byte)
	machineExec.SizeChan = make(chan remotecommand.TerminalSize)
	machineExec.ExitChan = make(chan bool)
	machineExec.ErrorChan = make(chan error)
	machineExec.ConnectionHandler = ws.NewConnHandler()

	execs.execMap[machineExec.ID] = machineExec

	return nil
}

// Remove information about exec
func (*KubernetesExecManager) Remove(execID int) {
	defer execs.mutex.Unlock()

	execs.mutex.Lock()
	delete(execs.execMap, execID)
}

// Check if exec with id exists
func (*KubernetesExecManager) Check(id int) (int, error) {
	machineExec := getByID(id)
	if machineExec == nil {
		logrus.Debugf("Exec '%d' was not found", id)
		return -1, errors.New("Exec '" + strconv.Itoa(id) + "' was not found")
	}
	logrus.Debugf("Exec was found after check: %d", id)
	return machineExec.ID, nil
}

// Attach websoket connection to the exec by id.
func (*KubernetesExecManager) Attach(id int, conn *websocket.Conn) error {
	machineExec := getByID(id)
	if machineExec == nil {
		logrus.Debugf("Exec '%d' to attach was not found", id)
		return errors.New("Exec '" + strconv.Itoa(id) + "' to attach was not found")
	}
	logrus.Debugf("Attach to exec %d", id)

	machineExec.ReadConnection(conn, machineExec.MsgChan)

	if machineExec.Buffer != nil {
		// restore previous output.
		restoreContent := machineExec.Buffer.GetContent()
		return conn.WriteMessage(websocket.TextMessage, []byte(restoreContent))
	}

	stopActivitySaver := make(chan bool, 1)
	go saveActivity(machineExec, stopActivitySaver)

	ptyHandler := PtyHandlerImpl{machineExec: machineExec, filter: &utf8stream.Utf8StreamFilter{}}
	machineExec.Buffer = line_buffer.New()

	err := machineExec.Executor.Stream(remotecommand.StreamOptions{
		Stdin:             ptyHandler,
		Stdout:            ptyHandler,
		Stderr:            ptyHandler,
		TerminalSizeQueue: ptyHandler,
		Tty:               machineExec.Tty,
	})

	stopActivitySaver <- true
	machineExec.ConnectionHandler.CloseConnections()

	if err != nil {
		machineExec.ErrorChan <- err
	} else {
		machineExec.ExitChan <- true
	}

	return err
}

// Resize exec output frame.
func (*KubernetesExecManager) Resize(id int, cols uint, rows uint) error {
	machineExec := getByID(id)
	if machineExec == nil {
		return errors.New("Exec to resize '" + strconv.Itoa(id) + "' was not found")
	}

	machineExec.SizeChan <- remotecommand.TerminalSize{Width: uint16(cols), Height: uint16(rows)}
	return nil
}

func (manager *KubernetesExecManager) CreateKubeConfig(kubeConfigParams *model.KubeConfigParams, containerInfo *model.ContainerInfo) error {
	machineExec := &model.MachineExec{
		BearerToken: kubeConfigParams.BearerToken,
	}
	k8sAPI, err := manager.k8sAPIProvider.GetK8sAPI(machineExec)
	if err != nil {
		logrus.Debugf("Unable to get k8sAPI %s", err.Error())
		return err
	}

	currentNamespace := GetNamespace()
	infoExecCreator := exec_info.NewKubernetesInfoExecCreator(currentNamespace, k8sAPI.GetClient().CoreV1(), k8sAPI.GetConfig())

	if kubeConfigParams.Namespace == "" {
		kubeConfigParams.Namespace = currentNamespace
	}
	err = kubeconfig.CreateKubeConfig(infoExecCreator, kubeConfigParams, containerInfo)
	if err != nil {
		return err
	}
	return nil
}

// getByID return exec by id.
func getByID(id int) *model.MachineExec {
	defer execs.mutex.Unlock()

	execs.mutex.Lock()
	return execs.execMap[id]
}

// List available containers
func (manager *KubernetesExecManager) ListAvailableContainers(machineExec *model.MachineExec) (containersInfo []*model.ContainerInfo, err error) {

	// use only token from this struct
	k8sAPI, err := manager.k8sAPIProvider.GetK8sAPI(machineExec)
	if err != nil {
		logrus.Debugf("Unable to get k8sAPI %s", err.Error())
		return nil, err
	}
	containerFilter := filter.NewKubernetesContainerFilter(manager.namespace, k8sAPI.GetClient().CoreV1())
	containersInfo, err = containerFilter.GetContainerList()
	if err != nil {
		return nil, err
	}
	return containersInfo, nil
}
