/*
 * Copyright (c) 2019 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { CloudShellTerminal, TerminalHandler } from "./terminal";
import { JsonRpcConnection } from "./json-rpc-connection";
import { GenericNotificationHandler } from "vscode-jsonrpc";
import { MachineExec, EXIT_METHOD, ERROR_METHOD, ExecExitEvent, ExecErrorEvent } from "./terminal-protocol";
import { NotificationType } from 'vscode-ws-jsonrpc';
import { ANSIControlSequences as CS } from './const';

const terminalElem = document.getElementById('terminal-container');

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
// CloudShell webapp expects to be available from /static/
// So, API should be available at /static/../
const basePath = (window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/') + '../';
const websocketBaseUrl = `${protocol}://${window.location.host}${basePath}`;
const connectUrl = websocketBaseUrl + 'connect';
const attachUrl = websocketBaseUrl + 'attach';

const terminal: CloudShellTerminal = new CloudShellTerminal();

terminal.open(terminalElem);
terminal.sendLine('Welcome to the Cloud Shell.');

const rpcConnecton = new JsonRpcConnection(connectUrl);
rpcConnecton.create().then(connection => {
    connection.onNotification('connected', (handler: GenericNotificationHandler) => {
        const exec: MachineExec = {
            tty: true,
            cols: terminal.cols,
            rows: terminal.rows
        };

        connection.sendRequest<{}>('create', exec).then((value: {}) => {
            const id = value as number;
            const attachConnection = rpcConnecton.createReconnectionWebsocket(`${attachUrl}/${id}`);

            attachConnection.onopen = (event: Event) => {
                // resize terminal first time on open
                connection.sendRequest('resize', {cols: terminal.cols, rows: terminal.rows, id});

                attachConnection.onmessage = (event: MessageEvent) => {
                    terminal.sendText(event.data);
                }

                const terminalHandler: TerminalHandler = {
                    onData(data: string):void {
                        attachConnection.send(data);
                    },
                    onResize(cols: number, rows: number) {
                        connection.sendRequest('resize', {cols, rows, id});
                    }
                }

                terminal.addHandler(terminalHandler);
            };
            attachConnection.onerror = (errEvn: ErrorEvent) => {
                console.log('Attach connection error: ', errEvn.error);
            }
            attachConnection.onclose = (event: CloseEvent) => {
                console.log('Attach connection closed: ', event.code);
            }
        }, 
        (onRejected: any) => {
            terminal.sendLine(CS.RED_COLOR + 'Unable to connect to json-rpc channel. Cause: ' + onRejected + CS.RESET_COLOR)
        });
    });
    const exitNotification = new NotificationType<ExecExitEvent, void>(EXIT_METHOD);
    connection.onNotification(exitNotification, (event: ExecExitEvent) => {
        terminal.sendLine(CS.GREEN_COLOR + "Process completed." + CS.RESET_COLOR)
    });

    const errorNotification = new NotificationType<ExecErrorEvent, void>(ERROR_METHOD);
    connection.onNotification(errorNotification, (event: ExecErrorEvent) => {
        terminal.sendLine(CS.RED_COLOR + 'Failed to create terminal. Error: ' + event.stack + CS.RESET_COLOR)
    });
}).catch(err => {
    terminal.sendLine(CS.RED_COLOR + 'Connection closed. Error: ' + err + CS.RESET_COLOR)
});
