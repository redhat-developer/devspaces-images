## About Eclipse Che Workspace Data Sync

This tooling provides the ability to increase I/O performance for a developer workspaces.

## Workspace lifecycle:

#### Workspaces Startup phase:
- Pods (workspace and data sync) are started in parallel.
#### Startup data sync phase:
- Data flow goes from the persistent volume (rsync server) to the ephemeral volume (rsync client).
#### Normal workspace usage phase:
- Containers in the Workspace Pod have full R/W access to the ephemeral volume with restored project sources.
- Container (rsync client) in the Workspace Pod have full R/W access to the persistent volume.
- Data flow goes from rsync client to rsync server periodically by cron job.
#### Workspace Shutdown phase
- Containers in the Workspace Pod stopped and data flushed to the persistent volume.

## Requirements

- Golang `1.12`
- Docker 

## Build

```sh
./build.sh -help
```

## Release 
1. Set released version in `VERSION` file
2. Push changes to the `release` branch

### License
Che is open sourced under the Eclipse Public License 2.0.
