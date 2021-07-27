const path = require('path');
const webpack = require('webpack');

const config = {
  entry: path.join(__dirname, 'src/index.ts'),
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  resolveLoader: {},
  plugins: [
    new webpack.ProgressPlugin(),
  ],
  target: 'node',
  node: {
    __dirname: false,
  },
  output: {
    filename: 'server.js',
    path: path.join(__dirname, 'lib')
  },
};

module.exports = (env = {}) => {
  return config;
};
