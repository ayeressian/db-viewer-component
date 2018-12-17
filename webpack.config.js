/* global require, module, __dirname */

const path = require('path');

module.exports = {
  devtool: 'source-map',
  devServer: {
    contentBase: './',
    port: 9998,
    historyApiFallback: {
      index: './example/index.html'
    },
    publicPath: '/dist',
    watchContentBase: true
  },
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
        test: /\.css$/,
        use: 'css-loader'
      },
      {
        test: /\.(html)$/,
        use: 'html-loader'
      }
    ]
  }
};
