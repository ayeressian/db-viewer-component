import { Configuration } from "webpack";
import config from "./webpack.config";

const testConfig: Configuration = {
  ...config,
  devServer: {
    contentBase: "./",
    historyApiFallback: {
      index: "./example/index.html",
    },
    port: 9998,
    publicPath: "/dist",
  },
};

export default testConfig;
