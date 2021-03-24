/*
 * Copyright (c) 2019 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import ReconnectingWebSocket from "reconnecting-websocket";
import { IWebSocket, ConsoleLogger, createWebSocketConnection, Logger, MessageConnection } from 'vscode-ws-jsonrpc';

export class JsonRpcConnection {

    private logger: Logger;

    constructor(readonly url: string) {
        this.logger = new ConsoleLogger();
    }

    create(): Promise<MessageConnection> {
        return new Promise<MessageConnection>((resolve, reject) => {
            const websocket = this.createReconnectionWebsocket(this.url);

            websocket.onopen = () => {
                const iWebSocket = this.toIWebSocket(websocket);
                const rpcConnection = createWebSocketConnection(iWebSocket, this.logger); 

                rpcConnection.listen();
                resolve(rpcConnection);
            }

            websocket.onerror = (err: ErrorEvent) => {
                reject(`Websocket connection closed with an error: ${err}`);
            }
        });
    }

    private toIWebSocket(webSocket: ReconnectingWebSocket): IWebSocket {
        return {
            send: content => webSocket.send(content),
            onMessage: callback => webSocket.onmessage = (msgEvent: MessageEvent) => callback(msgEvent.data),
            onError: callback => webSocket.onerror = error => callback(error.message),
            onClose: callback => webSocket.onclose = (event: CloseEvent) => callback(event.code, event.reason),
            dispose: () => webSocket.close()
        };
    }

    public createReconnectionWebsocket(url: string): ReconnectingWebSocket {
        return new ReconnectingWebSocket(
            url, 
            undefined, {
            maxReconnectionDelay: 10000,
            minReconnectionDelay: 1000,
            reconnectionDelayGrowFactor: 1.3,
            connectionTimeout: 10000,
            maxRetries: Infinity,
            debug: false
        });
    }
}
