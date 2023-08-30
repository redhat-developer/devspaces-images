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

const { merge } = require('webpack-merge');
const loaderUtils = require('loader-utils');
const path = require('path');
const webpack = require('webpack');
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const StylelintPlugin = require('stylelint-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();

const common = require('./webpack.config.common');

const config = {
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
                getLocalIdent: (context, localIdentName, localName, options) => {
                  if (localName.startsWith('pf-')) {
                    // preserve PatternFly class names
                    return localName;
                  }
                  return loaderUtils
                    .interpolateName(context, localIdentName, options)
                    .replace(/[<>:"/\\|?*.]/g, '-')
                    .replace('[local]', localName);
                },
              },
            },
          },
        ],
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __isBrowser__: 'true',
      'process.env.ENVIRONMENT': JSON.stringify('development'),
    }),
    new ESLintPlugin({
      cache: true,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new CleanTerminalPlugin(),
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
    chunkIds: 'named',
  },
  devtool: 'eval-cheap-module-source-map',
  watchOptions: {
    aggregateTimeout: 1000,
    ignored: /node_modules/,
  }
};

module.exports = (env = {
  speedMeasure: undefined,
}) => {
  const _config = merge(common(env), config);
  if(env.speedMeasure === 'true') {
    return smp.wrap(merge(_config, { stats: 'errors-only' }));
  }
  return _config;
};
