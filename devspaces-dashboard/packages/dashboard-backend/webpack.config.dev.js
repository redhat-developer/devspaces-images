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
const ESLintPlugin = require('eslint-webpack-plugin');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();

const common = require('./webpack.config.common');

const config = {
    mode: 'development',
    devtool: 'eval-source-map',
    watchOptions: {
      ignored: /node_modules/,
      poll: 1000,
    },
    plugins: [
      new ESLintPlugin({
        cache: true,
      }),
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
