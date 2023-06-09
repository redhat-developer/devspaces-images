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
const common = require('./webpack.config.common');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = {
  mode: 'production',
};

module.exports = (env = {
  bundleAnalyzer: undefined,
}) => {
  const _config = merge(common(), config)
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
