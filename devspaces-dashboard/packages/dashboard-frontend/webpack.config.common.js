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

const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const config = {
  entry: {
    client: path.join(__dirname, 'src/index.tsx'),
    'service-worker': path.join(__dirname, 'src/service-worker.ts'),
    'editor.worker': 'monaco-editor-core/esm/vs/editor/editor.worker.js',
    'accept-factory-link': path.join(__dirname, 'src/preload/index.ts'),
  },
  output: {
    path: path.join(__dirname, 'lib', 'public/dashboard'),
    publicPath: './',
    filename: (pathData) => {
      if (pathData.chunk.name === 'accept-factory-link') {
        return 'static/preload/[name].js';
      }
      if (pathData.chunk.name === 'service-worker' || pathData.chunk.name === 'editor.worker') {
        return '[name].js';
      }
      return '[name].[hash].js';
    },
    chunkFilename: '[name].[chunkhash].js',
    globalObject: 'this',
    clean: true,
  },
  optimization: {
    chunkIds: 'deterministic',
    splitChunks: {
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
          chunks: 'async',
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
        include: path.join(__dirname, 'src'),
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /node_modules[\\\\|\/](yaml-language-server)/,
        use: ['umd-compat-loader']
      },
      {
        test: /node_modules[\\\\|/](vscode-json-languageservice)/,
        use: ['umd-compat-loader']
      },
      {
        test: /prettier\/parser-yaml/,
        use: ['null-loader']
      },
      {
        test: /prettier/,
        use: ['null-loader']
      },
      {
        test: /\.(jpg|svg|woff|woff2|ttf|eot|ico)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      'vscode-languageserver-protocol/lib/utils/is': 'vscode-languageserver-protocol/lib/common/utils/is',
      'vscode-languageserver-protocol/lib/main': 'vscode-languageserver-protocol/lib/node/main',
    },
    fallback: {
      "fs": false,
      "net": false,
      "module": false,
      "path": false,
      "os": false,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
    },
  },
  resolveLoader: {},
  node: { global: true },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'process.env.DASHBOARD_VERSION': JSON.stringify(require('./package.json').version),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './index.html'),
      chunks : ['client', 'service-worker', 'editor.worker'],
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/preload/index.html'),
      chunks : ['accept-factory-link'],
      filename: '../index.html',
      publicPath: '/dashboard/',
    }),
    new CopyPlugin({
      patterns: [
        { from: path.join(__dirname, 'assets'), to: 'assets' },
        { from: path.join(__dirname, 'static'), to: 'static' },
      ]
    }),
  ],
};

module.exports = (env = {}) => {
  return config;
};
