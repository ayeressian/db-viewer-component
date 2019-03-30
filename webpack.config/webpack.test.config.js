const config = require('./webpack.config.js');

config.mode = 'development';

config.target = 'node';

module.exports = config;
