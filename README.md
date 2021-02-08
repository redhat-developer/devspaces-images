# configbump

This is a simple Kubernetes controller that is able to quickly synchronize a set of configmaps (selected using labels) to files
on local filesystem.

Additionally, this tool can send a signal to another process (hence the "bump" in the name).

The combination of the two capabilities can be used to enable dynamic reconfiguration or restarts on configuration change for any program that is able to respond to the signals.

This makes it possible to for example use this tool as a sidecar to a container. As long as they share (parts of) the filesystem, this tool can supply the configuration to the program in the other container. If the two containers also share the process namespace, this tool can also be used for the signalling of the other process.

Another approach to use this tool is to create a custom image that would build on top of the original one and start both the original program and configbump.

## Current State

At the moment, only the configmap syncing is implemented. This makes the tool usable only with programs that can respond to changes in the filesystem on their own. We use it to dynamically supply configuration to Traefik configured to watch a directory for additional configuration files. Surprisingly, in our testing this seemed to be faster than using Traefik's own CRDs to achieve the same thing. It also doesn't need to install additional custom resources into the Kubernetes cluster.

## Future plans

When the process signalling is implemented, this tool will be compatible with many more programs to enable dynamic reconfiguration from the configmaps in the cluster.

We originally wrote a prototype of this tool in Rust (https://github.com/metlos/cm-bump) that implements both configmap syncing and process signalling and we successfully used it for dynamic reconfiguration of HAProxy, Nginx and Traefik.

## Configuration

```
$ ./configbump --help
config-bump 0.1.0
Usage: configbump --dir DIR --labels LABELS [--namespace NAMESPACE]

Options:
  --dir DIR, -d DIR      The directory to which persist the files retrieved from config maps. Can also be specified using env var: CONFIG_BUMP_DIR
  --labels LABELS, -l LABELS
                         An expression to match the labels against. Consult the Kubernetes documentation for the syntax required. Can also be specified using env var: CONFIG_BUMP_LABELS
  --namespace NAMESPACE, -n NAMESPACE
                         The namespace in which to look for the config maps to persist. Can also be specified using env var: CONFIG_BUMP_NAMESPACE. If not specified, it is autodetected.
  --help, -h             display this help and exit
  --version              display version and exit
```

## Examples

An example of using Traefik with configbump as a sidecar in a single pod to enable configbump dynamically downloading configuration files to a directory that Traefik watches for configuration changes can be found in deploy_example.yaml file.
To apply it:
```
kubectl apply -f deploy_example.yaml
```