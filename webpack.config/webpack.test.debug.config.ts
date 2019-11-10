import path from 'path';
import config from './webpack.test.config';

config.devServer = {
  contentBase: 'test/dist',
  port: 10001,
};

config.entry = {
  test: [`mocha-loader!./test/index.ts`],
};

config.target = 'web';

config.output = {
  filename: 'test.build.js',
  path: path.resolve(__dirname, '../test/dist'),
};

export default config;
