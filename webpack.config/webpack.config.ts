import path from "path";
import { Configuration } from "webpack";

const config: Configuration = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: "css-loader",
      },
      {
        test: /\.(html)$/,
        use: "html-loader",
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: ["url-loader?limit=10000", "img-loader"],
      },
      {
        loader: "ts-loader",
        test: /\.ts$/,
      },
    ],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "../dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "source-map",
};

export default config;
