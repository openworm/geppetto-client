var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function (env) {


  return {

    output: {
      path: path.resolve(__dirname, 'build'),
      filename: '[name].bundle.js',
      publicPath: '/'
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new HtmlWebPackPlugin({
        template: "./showcase/index.html",
        filename: "./index.html"
      })
    ],
    
    entry: "./showcase/index.js",
 
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: [], 
          use: {
            loader: "babel-loader",
            options: { 
              presets: [
                '@babel/preset-env',
                '@babel/preset-react'
              ],
              plugins: [
                "@babel/plugin-syntax-dynamic-import",
                "@babel/plugin-proposal-class-properties"
              ]
            }
          }
        },
        // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        {
          test: /\.tsx?$/,
          loader: "awesome-typescript-loader"
        },
        {
          test: /Dockerfile/,
          loader: 'ignore-loader'
        },
        {
          test: /\.(py|jpeg|svg|gif|css|jpg|md|hbs|dcm|gz|xmi|dzi|sh|obj|yml|nii)$/,
          loader: 'ignore-loader'
        },
        {
          test: /\.(png|eot|ttf|woff|woff2|svg)(\?[a-z0-9=.]+)?$/,
          loader: 'url-loader?limit=100000'
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.less$/,
          loader: 'style-loader!css-loader!less-loader'
        },
        {
          test: /\.html$/,
          loader: 'raw-loader'
        }
      ]
    },
    devServer: { contentBase: './build', },
    resolve: { extensions: ['.js', '.jsx'], },
    node: {
      fs: 'empty',
      child_process: 'empty',
      module: 'empty'
    },
  }
};
