/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

const merge = require('webpack-merge');
const path = require('path');

const devConfig = require('./webpack.config.dev');

module.exports = (env = {}) => {
  const proxyTarget = env.server;
  if (!proxyTarget) {
    throw new Error('Che server URL is not set. Argument "--env.server=" is mandatory in development mode.');
  }
  const headers = {
    origin: proxyTarget,
  };
  if (env.token) {
    headers['Authorization'] = `Bearer ${env.token}`;
  }

  const dashboardServer = env.dashboardServer ? env.dashboardServer : proxyTarget;

  return merge(devConfig(env), {
    devServer: {
      publicPath: '/',
      clientLogLevel: 'debug',
      disableHostCheck: true,
      host: 'localhost',
      hot: true,
      open: false,
      port: 3000,
      stats: 'errors-warnings',
      writeToDisk: true,
      proxy: {
        '/api/websocket': {
          target: proxyTarget,
          ws: true,
          secure: false,
          changeOrigin: true,
          headers: headers
        },
        '/dashboard/api/websocket': {
          target: dashboardServer,
          ws: true,
          secure: false,
          changeOrigin: true,
          headers: {
            origin: dashboardServer,
          },
        },
        '/dashboard/api': {
          target: dashboardServer,
          secure: false,
          changeOrigin: true,
          headers: {
            origin: dashboardServer,
          },
        },
        '/api': {
          target: proxyTarget,
          secure: false,
          changeOrigin: true,
          headers: headers,
        }
      },
    },
  });
};
