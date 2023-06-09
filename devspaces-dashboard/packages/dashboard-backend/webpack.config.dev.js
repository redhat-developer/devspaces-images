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
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const smp = new SpeedMeasurePlugin();

const common = require('./webpack.config.common');

const config = {
    mode: 'development',
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
      ]
    },
    devtool: 'eval-source-map',
    watchOptions: {
      ignored: /node_modules/,
      poll: 1000,
    },
    externals: [
      nodeExternals(),
    ],
};

module.exports = (env = {
  speedMeasure: undefined,
}) => {
  const _config = merge(common(), config)
  if(env.speedMeasure === 'true') {
    return smp.wrap(merge(_config, { stats: 'errors-only' }));
  }
  return _config;
};
