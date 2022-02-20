const path = require('path');

const devtoolsConfig =
    (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true')
        ? {
            devtool: 'source-map',
        }
        : {};

module.exports = {
    ...devtoolsConfig,
    entry: './src/main/main.ts',
    module: {
        rules: require('./webpack.rules'),
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    },
};
