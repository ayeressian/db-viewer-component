import path from 'path';
import { Configuration } from 'webpack';
import testConfig from './webpack.test.config';

const testDebugConfig: Configuration = {
  ...testConfig,
  devServer: {
    contentBase: 'test/dist',
    port: 10001,
  },
  entry: {
    test: [`mocha-loader!./test/index.ts`],
  },
  output: {
    filename: 'test.build.js',
    path: path.resolve(__dirname, '../test/dist'),
  },
  target: 'web',
};

export default testDebugConfig;
