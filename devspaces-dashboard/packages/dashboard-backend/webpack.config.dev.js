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

const common = require('./webpack.config.common');
module.exports = () => {
  return merge(common(), {
    mode: 'development',
    devtool: 'eval-source-map',
    watchOptions: {
      ignored: /node_modules/,
      poll: 1000,
    },
    externals: [
      nodeExternals(),
    ],
  });
};
