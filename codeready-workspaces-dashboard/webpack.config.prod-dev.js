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

const path = require('path');
const merge = require('webpack-merge');

const prod = require('./webpack.config.prod');

module.exports = env => {
  const proxyTarget = env && env.server ? env.server : 'https://codeready-codeready-workspaces-operator.apps.sandbox.x8i5.p1.openshiftapps.com';

  return merge(prod, {
    mode: 'production',
    devServer: {
      contentBase: [
        path.join(__dirname, 'lib'),
      ],
      clientLogLevel: 'debug',
      contentBasePublicPath: '/',
      disableHostCheck: true,
      host: 'localhost',
      open: false,
      port: 3000,
      stats: 'normal',
      writeToDisk: true,
      proxy: {
        '/api/websocket': {
          target: proxyTarget,
          ws: true,
          secure: false,
          changeOrigin: true,
          headers: {
            origin: proxyTarget
          }
        },
        '/api': {
          target: proxyTarget,
          secure: false,
          changeOrigin: true,
          headers: {
            origin: proxyTarget
          },
        },
      },
    },
    watchOptions: {
      aggregateTimeout: 2000,
      ignored: /node_modules/,
    },
  });
};
