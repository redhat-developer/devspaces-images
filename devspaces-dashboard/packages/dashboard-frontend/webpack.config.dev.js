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

module.exports = (env = {}) => {
  return merge(common(env), {
    mode: 'development',
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.(tsx|ts|jsx|js)$/,
          use: [{
            loader: 'source-map-loader'
          }],
          include: [
            path.resolve(__dirname, '../common'),
            path.resolve(__dirname, 'src'),
          ],
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
    watchOptions: {
      aggregateTimeout: 1000,
      ignored: /node_modules/,
    },
  });
};
