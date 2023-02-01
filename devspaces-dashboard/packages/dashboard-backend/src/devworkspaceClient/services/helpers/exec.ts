/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { helpers } from '@eclipse-che/common';
import { stringify } from 'querystring';
import WebSocket from 'ws';

export type ServerConfig = {
  opts: { [key: string]: any };
  server: string;
};

const PROTOCOLS = ['base64.channel.k8s.io'];

enum CHANNELS {
  STD_OUT = 1,
  STD_ERROR,
  ERROR,
}

/**
 * Execute the given command inside of a given container in a pod with a name and namespace and return the
 * stdout and stderr responses
 * @param pod The name of the pod
 * @param namespace The namespace where the pod lives
 * @param container The name of the container
 * @param command The command to return
 * @param serverConfig The current cluster configuration
 * @returns The object containing the stdOut and stdErr of running the command in the container
 */
export async function exec(
  pod: string,
  namespace: string,
  container: string,
  command: string[],
  serverConfig: ServerConfig,
): Promise<{ stdOut: string; stdError: string }> {
  // Wait until the exec request is done and reject if the final status is a failure, otherwise
  // everything went OK and stdOutStream contains the response
  let stdOut = '';
  let stdError = '';
  const { server, opts } = serverConfig;
  try {
    await new Promise<void>((resolve, reject) => {
      const k8sServer = server.replace(/^http/, 'ws');
      if (!k8sServer) {
        reject('Failed to get kubernetes client server.');
      }
      const queryStr = stringify({ stdout: true, stderr: true, command, container });
      const url = `${k8sServer}/api/v1/namespaces/${namespace}/pods/${pod}/exec?${queryStr}`;

      const client = new WebSocket(url, PROTOCOLS, opts);
      let openTimeoutObj: NodeJS.Timeout | undefined;
      let responseTimeoutObj: NodeJS.Timeout | undefined;

      client.onopen = () => {
        openTimeoutObj = setTimeout(() => {
          if (client.OPEN) {
            client.close();
          }
        }, 30000);
      };

      client.onclose = () => {
        resolve();
        if (openTimeoutObj) {
          clearTimeout(openTimeoutObj);
        }
        if (responseTimeoutObj) {
          clearTimeout(responseTimeoutObj);
        }
      };

      client.onerror = err => {
        const message = helpers.errors.getMessage(err);
        stdError += message;
        reject(message);
        client.close();
      };

      client.onmessage = event => {
        if (typeof event.data !== 'string') {
          return;
        }
        const channel = CHANNELS[parseInt(event.data[0], 8)];

        if (channel === CHANNELS[CHANNELS.STD_OUT] && event.data.length === 1) {
          if (!responseTimeoutObj) {
            responseTimeoutObj = setTimeout(() => {
              if (client.OPEN) {
                client.close();
              }
            }, 3000);
          }
          return;
        }

        let message = Buffer.from(event.data.substr(1), 'base64').toString('utf-8');
        message = message.replace(/\n/g, ' ').trim();

        if (channel === CHANNELS[CHANNELS.STD_OUT]) {
          stdOut += message;
        } else if (channel === CHANNELS[CHANNELS.STD_ERROR]) {
          stdError += message;
        } else if (channel === CHANNELS[CHANNELS.ERROR]) {
          stdError += message;
        }
        client.close();
      };
    });
  } catch (e) {
    throw helpers.errors.getMessage(e);
  }
  return { stdOut, stdError };
}
