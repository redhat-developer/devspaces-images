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

const StylelintPlugin = require('stylelint-webpack-plugin');
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const loaderUtils = require('loader-utils');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const common = require('./webpack.config.common.js');

const config = {
  mode: 'production',
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
                  if (localName.startsWith('pf-') || localName.startsWith('monaco')) {
                    // preserve PatternFly class names
                    return localName;
                  }
                  const hash = loaderUtils.getHashDigest(context.context, 'md5', 'hex');
                  return localIdentName.replace('[local]', localName).replace('[hash]', hash);
                },
                context: path.resolve(__dirname),
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
    new StylelintPlugin({
      context: path.join(__dirname, 'src'),
      files: '**/*.css',
      fix: true,
    }),
    new CleanTerminalPlugin(),
  ],
};

module.exports = (env = {}) => {
  return merge(common(env), config);
};
