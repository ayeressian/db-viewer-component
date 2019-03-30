const config = require('./webpack.test.config.js');
const path = require('path');

config.devServer = {
  contentBase: 'spec/dist',
  port: 10001
};

config.entry = {
  test: [`mocha-loader!./spec/index.js`]
};

config.target = 'web';

config.output = {
  filename: 'spec.build.js',
  path: path.resolve(__dirname, '../spec/dist')
},

module.exports = config;
