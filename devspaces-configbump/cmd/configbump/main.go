package main

import (
	"github.com/go-logr/zapr"
	"go.uber.org/zap"
	"os"

	arg "github.com/alexflint/go-arg"
	"github.com/che-incubator/configbump/pkg/configmaps"
	"github.com/operator-framework/operator-sdk/pkg/k8sutil"
	"github.com/operator-framework/operator-sdk/pkg/ready"
	"sigs.k8s.io/controller-runtime/pkg/client/config"
	logf "sigs.k8s.io/controller-runtime/pkg/runtime/log"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/runtime/signals"
)

// Opts represents the commandline arguments to the executable
type opts struct {
	Dir string `arg:"-d,required,env:CONFIG_BUMP_DIR" help:"The directory to which persist the files retrieved from config maps. Can also be specified using env var: CONFIG_BUMP_DIR"`

	// TODO not supported yet
	//TLSVerify bool `arg:"--tls-verify,-t,env:CONFIG_BUMP_TLS_VERIFY" default:"true" help:"Whether to require valid certificate chain. Can also be specified using env var: CONFIG_BUMP_TLS_VERIFY"`

	Labels    string `arg:"-l,required,env:CONFIG_BUMP_LABELS" help:"An expression to match the labels against. Consult the Kubernetes documentation for the syntax required. Can also be specified using env var: CONFIG_BUMP_LABELS"`
	Namespace string `arg:"-n,env:CONFIG_BUMP_NAMESPACE" help:"The namespace in which to look for the config maps to persist. Can also be specified using env var: CONFIG_BUMP_NAMESPACE. If not specified, it is autodetected."`

	// TODO the whole process bumping not implemented yet.
	//ProcessCommand       string `arg:"--process-command,-c,env:CONFIG_BUMP_PROCESS_COMMAND" help:"The commandline by which to identify the process to send the signal to. This can be a regular expression. Ignored if process pid is specified. Can also be specified using env var: CONFIG_BUMP_PROCESS_COMMAND"`
	//ProcessPid           int32  `arg:"--process-pid,-p,env:CONFIG_BUMP_PROCESS_PID" help:"The PID of the process to send the signal to, if known. Otherwise process detection can be used. Can also be specified using env var: CONFIG_BUMP_PROCESS_PID"`
	//ProcessParentCommand string `arg:"--process-parent-command,-a,env:CONFIG_BUMP_PARENT_PROCESS_COMMAND" help:"The commandline by which to identify the parent process of the process to send signal to. This can be a regular expression. Ignored if parent process pid is specified. Can also be specified using env var: CONFIG_BUMP_PARENT_PROCESS_COMMAND"`
	//ProcessParentPid     int32  `arg:"--process-parent-pid,-i,env:CONFIG_BUMP_PARENT_PROCESS_PID" help:"The PID of the parent process of the process to send the signal to, if known. Otherwise process detection can be used. Can also be specified using env var: CONFIG_BUMP_PARENT_PROCESS_PID"`
	//Signal               string `arg:"-s,env:CONFIG_BUMP_SIGNAL" help:"The name of the signal to send to the process on the configuration files change. Use 'kill -l' to get a list of possible signals. Can also be specified using env var: CONFIG_BUMP_SIGNAL"`
}

// Version returns the version of the program
func (opts) Version() string {
	return "config-bump 0.1.0"
}

const controllerName = "config-bump"

var log = logf.Log.WithName(controllerName)

func main() {
	zap, err := zap.NewProduction()
	if err != nil {
		println("Failed to initialize a zap logger.")
		os.Exit(1)
	}
	logf.SetLogger(zapr.NewLogger(zap))
	var opts opts
	arg.MustParse(&opts)

	// process signalling not implemented yet.
	// d, err := bumper.DetectCommand(opts.ProcessCommand)
	// if err != nil {
	// }
	// var ds []bumper.Detection = []bumper.Detection{d}
	// b := bumper.New(opts.Signal, ds)

	// once process signalling is implemented, we can call:
	// initializeConfigMapController(opts.Labels, opts.Dir, b.Bump)
	if err := initializeConfigMapController(opts.Labels, opts.Dir, opts.Namespace, func() error { return nil }); err != nil {
		log.Error(err, "Could not initialize the config map sync controller")
		os.Exit(1)
	}
}

func initializeConfigMapController(labels string, baseDir string, namespace string, onReconcileDone func() error) error {
	// Get a config to talk to the apiserver
	cfg, err := config.GetConfig()
	if err != nil {
		return err
	}

	if namespace == "" {
		namespace, err = k8sutil.GetWatchNamespace()
		if err != nil {
			namespace, err = k8sutil.GetOperatorNamespace()
			if err != nil {
				return err
			}
		}
	}

	ready := ready.NewFileReady()
	err = ready.Set()
	if err != nil {
		return err
	}
	defer ready.Unset()

	mgr, err := manager.New(cfg, manager.Options{MetricsBindAddress: "0", Namespace: namespace})
	if err != nil {
		return err
	}

	_, err = configmaps.New(mgr, configmaps.ConfigMapReconcilerConfig{
		BaseDir:         baseDir,
		Labels:          labels,
		OnReconcileDone: onReconcileDone,
		Namespace:       namespace,
	})

	if err != nil {
		return err
	}

	return mgr.Start(signals.SetupSignalHandler())
}
