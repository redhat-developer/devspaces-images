const path = require('path');

var server = {
    entry: './src/index.ts',
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
        extensions: ['.ts', '.js']
    },
    target: 'node',
    output: {
        filename: 'server.js',
        library: 'workspace-client',
        libraryTarget: 'umd',
        globalObject: 'this',
        path: path.resolve(__dirname, 'dist')
    }
};

var client = {
    entry: './src/index.ts',
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
        extensions: ['.ts', '.js']
    },
    target: 'web',
    node: {
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    },
    output: {
        filename: 'client.js',
        library: 'workspace-client',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist')
    }
};

module.exports = [client, server];
