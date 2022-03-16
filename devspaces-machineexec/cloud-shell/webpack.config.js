const path = require('path');

module.exports = {
  entry: ['./src/index.ts'],
  devtool: 'inline-source-map',
  node: {
    net: 'empty',
  },
  module: {
    rules: [
        {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }]
        }
    ],
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: [ '.tsx', '.ts', '.js', '.css', '.scss'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};