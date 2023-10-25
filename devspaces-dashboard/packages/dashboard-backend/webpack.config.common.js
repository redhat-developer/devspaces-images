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
          enforce: 'pre',
          test: /\.(ts|js)$/,
          use: ['source-map-loader'],
          include: [path.resolve(__dirname, '../common'), path.resolve(__dirname, 'src')],
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        // alias for absolute imports (see tsconfig.json)
        '@': path.resolve(__dirname, 'src/'),
      },
    },
    resolveLoader: {},
    plugins: [
      new webpack.ProgressPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(
              '..',
              '..',
              'node_modules',
              '@fastify/swagger-ui',
              'static',
              'logo.svg',
            ),
            to: 'server/static',
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve('..', '..', 'node_modules', '@fastify/swagger-ui', 'static'),
            to: 'static',
          },
        ],
      }),
    ],
    node: {
      __dirname: false,
    },
    target: 'node',
  };
};
