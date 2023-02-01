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

const merge = require('webpack-merge');

const devConfig = require('./webpack.config.dev');

module.exports = () => {
  const headers = {
    origin: 'http://localhost:8080/',
  };

  return merge(devConfig(), {
    devServer: {
      client: {
        logging: 'info',
      },
      devMiddleware: {
        publicPath: '/dashboard/',
        writeToDisk: false,
      },
      host: 'localhost',
      hot: true,
      open: false,
      port: 3000,
      proxy: {
        '/api/websocket': {
          target: headers.origin,
          ws: true,
          secure: false,
          changeOrigin: true,
          headers
        },
        '/dashboard/api/websocket': {
          target: headers.origin,
          ws: true,
          secure: false,
          changeOrigin: true,
          headers,
        },
        '/dashboard/devfile-registry': {
          target: headers.origin,
          secure: false,
          changeOrigin: true,
          headers,
        },
        '/dashboard/api': {
          target: headers.origin,
          secure: false,
          changeOrigin: true,
          headers,
        },
        '/auth': {
          target: headers.origin,
          secure: false,
          changeOrigin: true,
          headers,
        },
        '/oauth': {
          target: headers.origin,
          secure: false,
          changeOrigin: true,
          headers,
        },
        '/api': {
          target: headers.origin,
          secure: false,
          changeOrigin: true,
          headers,
        }
      },
    },
  });
};
