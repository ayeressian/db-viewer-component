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
  entry: './src/index.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: 'css-loader'
      },
      {
        test: /\.(html)$/,
        use: 'html-loader'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          'url-loader?limit=10000',
          'img-loader'
        ]
      }
    ]
  }
};
