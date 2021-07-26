const path = require('path');
const webpack = require('webpack');

const config = {
    entry: path.join(__dirname, 'src/index.ts'),
    devtool: 'source-map',
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
    output: {
        filename: 'server.js',
        library: 'dashboard-backend',
        libraryTarget: 'umd',
        globalObject: 'this',
        path: path.resolve(__dirname, 'lib')
    },
};

module.exports = (env = {}) => {
  return config;
};
