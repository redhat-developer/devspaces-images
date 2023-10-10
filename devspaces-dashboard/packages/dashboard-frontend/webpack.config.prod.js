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

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const loaderUtils = require('loader-utils');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const common = require('./webpack.config.common.js');

const config = {
  mode: 'production',
  optimization: {
    chunkIds: 'deterministic',
    minimize: true,
    minimizer: [
      `...`,
      new CssMinimizerPlugin(),
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: '[local]_[hash]',
                getLocalIdent: (context, localIdentName, localName) => {
                  if (localName.startsWith('pf-') || localName.startsWith('CodeMirror')) {
                    // preserve PatternFly class names
                    return localName;
                  }
                  const hash = loaderUtils.getHashDigest(context.context, 'md5', 'hex');
                  return localIdentName.replace('[local]', localName).replace('[hash]', hash);
                },
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
    }),
    new webpack.DefinePlugin({
      __isBrowser__: 'true',
      'process.env.ENVIRONMENT': JSON.stringify('production'),
    }),
    new webpack.ProgressPlugin(),
    new CleanTerminalPlugin(),
  ],
};

module.exports = (env = {
  bundleAnalyzer: undefined,
}) => {
  const _config = merge(common(env), config)
  if(env.bundleAnalyzer === 'true') {
    return merge(_config, {
      plugins: [
        new BundleAnalyzerPlugin({
          analyzerHost: '0.0.0.0',
          analyzerPort: 8888,
        }),
      ],
    });
  }
  return _config;
};
