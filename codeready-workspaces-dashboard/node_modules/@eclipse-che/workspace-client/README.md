# Workspace client

This is a client for workspace REST API and workspace master JSON-RPC API interactions.

## Examples

### REST API client

```typescript
import WorkspaceClient from '@eclipse-che/workspace-client';

const restApiClient = WorkspaceClient.getRestApi();
// get list of workspaces
const promise = restApiClient.getAll();
promise.then((workspaces) => {
    // process workspaces here
});
```

### JSON-RPC API client

```typescript
import WorkspaceClient from '@eclipse-che/workspace-client';

const entryPoint = '/api/workspace';
const masterApiClient = WorkspaceClient.getJsonRpcApi(entryPoint);
const connectionPromise = masterApiClient.connect(entryPoint);
// get client ID
connectionPromise.then(() => {
    const clientId = masterApiClient.getClientId();
});
const statusChangeHandler = message => {
    const status = message.status;
};
// subscribe to workspace status changes
masterApiClient.subscribeWorkspaceStatus('workspace-id', statusChangeHandler);
```
## License

EPL-2
