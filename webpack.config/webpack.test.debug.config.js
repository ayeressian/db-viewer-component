const config = require('./webpack.test.config.js');
const path = require('path');

config.devServer = {
  contentBase: 'test/dist',
  port: 10001
};

config.entry = {
  test: [`mocha-loader!./test/index.js`]
};

config.target = 'web';

config.output = {
  filename: 'test.build.js',
  path: path.resolve(__dirname, '../test/dist')
},

module.exports = config;
