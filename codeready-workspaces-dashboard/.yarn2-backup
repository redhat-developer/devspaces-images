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

const PnpPlugin = require('pnp-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const stylus_plugin = require('poststylus');
const stylusLoader = require('stylus-loader');

const path = require('path');

module.exports = {
  entry: {
    client: path.join(__dirname, 'src/index.tsx'),
  },
  output: {
    path: path.join(__dirname, 'lib'),
    publicPath: '/',
    filename: 'client.[hash].js',
    chunkFilename: '[name].[chunkhash].js',
  },
  optimization: {
    chunkIds: 'named',
    splitChunks: {
      name: 'vendor',
      chunks: 'initial',
      cacheGroups: {
        default: false,
        vendors: false,
        monaco: {
          name: 'monaco',
          chunks: 'all',
          priority: 25,
          test: /monaco/
        },
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        include: path.join(__dirname, 'src'),
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          cache: true,
        },
      },
      {
        test: /\.tsx?$/,
        include: path.join(__dirname, 'src'),
        use: [
          {
            loader: 'ts-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /node_modules[\\\\|\/](yaml-language-server)/,
        loader: 'umd-compat-loader'
      },
      {
        test: /node_modules[\\\\|/](vscode-json-languageservice)/,
        loader: 'umd-compat-loader',
      },
      {
        test: /prettier\/parser-yaml/,
        loader: 'null-loader',
      },
      {
        test: /prettier/,
        loader: 'null-loader',
      },
      {
        test: /\.styl$/,
        loader: 'style-loader!css-loader!stylus-loader',
      },
      {
        test: /\.(jpg|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/'
        }
      },
    ]
  },
  resolve: {
    plugins: [PnpPlugin],
    extensions: ['.js', '.ts', '.tsx']
  },
  resolveLoader: {
    plugins: [PnpPlugin.moduleLoader(module)],
  },
  node: {
    fs: 'empty',
    net: 'empty',
    module: 'empty'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    }),
    new stylusLoader.OptionsPlugin({
      default: {
        use: [stylus_plugin()],
      },
    }),
    new CleanWebpackPlugin(),
  ],
};
