const FileSystem = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
    entry: {
      main: './src/index.js',
    },
    output: {
      filename: '[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
      minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
      splitChunks: {
        chunks: 'all',
      },
    },
    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      }),
      function() {
        this.plugin('done', function(statsData) {
          var stats = statsData.toJson();

          if (!stats.errors.length) {
            var htmlFileName = 'index.html';
            var html = FileSystem.readFileSync(path.join(__dirname, htmlFileName), 'utf8');

            console.log(stats.assetsByChunkName.main);
            var htmlOutput = html.replace(
              /vendors~main.bundle.js/i,
              stats.assetsByChunkName['vendors~main']);

            htmlOutput = htmlOutput.replace(
              /main.bundle.css/i,
              stats.assetsByChunkName.main[0]);

            htmlOutput = htmlOutput.replace(
              /main.bundle.js/i,
              stats.assetsByChunkName.main[1]);

            FileSystem.writeFileSync(
              path.join(__dirname, 'dist', htmlFileName),
              htmlOutput);
          }
        })
      }
    ],
    module: {

      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            'css-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|ico)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'assets/[name].[ext]',
              },
            },
          ],
        },
      ],
    },
  };