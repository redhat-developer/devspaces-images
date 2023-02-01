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

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = () => {
  return {
    entry: path.join(__dirname, 'src/server.ts'),
    output: {
      filename: path.join('server', 'backend.js'),
      path: path.join(__dirname, 'lib'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          enforce: 'pre',
          include: path.join(__dirname, 'src'),
          exclude: /node_modules/,
          use: [{
            loader: 'eslint-loader',
            options: {
              cache: true,
            }
          }],
        },
        {
          enforce: 'pre',
          test: /\.(ts|js)$/,
          use: ["source-map-loader"],
          include: [
            path.resolve(__dirname, '../common'),
            path.resolve(__dirname, 'src'),
          ],
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
        },
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    resolveLoader: {},
    plugins: [
      new webpack.ProgressPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve('..', '..', 'node_modules', '@fastify/swagger', 'static'),
            to: 'static/',
            transform(content, absoluteFrom) {
              // it needs to hide the top bar(the definition URL path)
              if (absoluteFrom.split('/').reverse()[0] === 'index.html') {
                return content.toString().replace('layout: "StandaloneLayout"', '');
              }
              return content.toString();
            },
          }
        ]
      }),
    ],
    target: 'node',
    node: {
      __dirname: false,
    },
    externals: [
      'long',
      'pino-pretty',
    ],
  };

};
