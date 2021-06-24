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
const webpack = require('webpack');
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');

const common = require('./webpack.config.common');

module.exports = env => {
  const proxyTarget = env && env.server;
  if (!proxyTarget) {
    throw new Error('Che server URL is not set. Argument "--env.server=" is mandatory in development mode.');
  }
  const headers = {
    origin: proxyTarget,
  };
  if (env && env.token) {
    headers['Authorization'] = `Bearer ${env.token}`;
  }

  return merge(common, {
    mode: 'development',
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.(tsx|ts|jsx|js)$/,
          loader: 'source-map-loader',
          include: path.resolve(__dirname, 'src'),
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[path][name]__[local]',
                },
              },
            },
          ],
        },
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        __isBrowser__: "true",
        'process.env.ENVIRONMENT': JSON.stringify('development'),
        'process.env.SERVER': JSON.stringify(env.server),
      }),
      new webpack.HotModuleReplacementPlugin(),
      new CleanTerminalPlugin(),
      new HardSourceWebpackPlugin(),
      new StylelintPlugin({
        context: path.join(__dirname, 'src'),
        emitWarning: true,
        files: '**/*.css',
        lintDirtyModulesOnly: true,
      }),
    ],
    output: {
      chunkFilename: undefined,
    },
    optimization: {
      minimize: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },
    devtool: 'eval-cheap-module-source-map',
    devServer: {
      clientLogLevel: 'debug',
      contentBase: path.join(__dirname, 'assets'),
      contentBasePublicPath: '/assets/',
      disableHostCheck: true,
      host: 'localhost',
      hot: true,
      open: false,
      port: 3000,
      stats: 'errors-warnings',
      // writeToDisk: true,
      proxy: {
        '/api/websocket': {
          target: proxyTarget,
          ws: true,
          secure: false,
          changeOrigin: true,
          headers: headers
        },
        '/api': {
          target: proxyTarget,
          secure: false,
          changeOrigin: true,
          headers: headers,
        },
      },
    },
    watchOptions: {
      aggregateTimeout: 1000,
      ignored: /node_modules/,
    },
  });
};
