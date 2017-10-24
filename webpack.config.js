var webpack = require('webpack');
var path = require('path');

module.exports = {
    devtool: 'inline-source-map',
    entry: {
        dev: [
          'webpack-dev-server/client?http://127.0.0.1:8080/',
          'webpack/hot/only-dev-server'
        ],
        app: './src/app',
        vendor: [
          'angular',
          'angular-route',
          'angular-touch',
          'ng-file-upload',
          'angular-ui-bootstrap/src/modal',
          'angular-ui-bootstrap/src/dropdown',
          'css/bootstrap.min.css',
          'css/bootstrap-glyphicons.css',
          'css/typeahead.js-bootstrap.css',
          'css/datetimepicker.css'
        ]
    },
    output: {
        path: path.join(__dirname, 'public'),
        filename: '[name].js',
        chunkFilename: '[id].js'
    },
    resolve: {
        modulesDirectories: ['node_modules', 'src'],
        extension: ['', '.js'],
        alias: {
          underscore: 'underscore/underscore',
          bootstrap: 'bootstrap/dist/js/bootstrap',
          moment: 'moment/moment'
        }
    },
    module: {
        loaders: [
          {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel',
              query: {
                  presets: ['es2015']
              }
          },
          {
              test: /\.jade$/,
              loader: 'jade-loader?self'
          },
          {
              test: /\.(woff2?|ttf|eot|svg|gif|png)$/,
              loader: 'url?limit=10000'
          },
          {
              test: /\.css$/,
              loader: 'style-loader!css-loader'
          // },
          // {
          //     test: /app\/.+\.(jsx|js)$/,
          //     loader: 'imports?jQuery=jquery,$=jquery'
          }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.ProvidePlugin({
          $: 'jquery',
          _: 'underscore',
          moment: 'moment'
        })
    ],
    devServer: {
        hot: true,
        proxy: {
            '*': 'http://localhost:3000'
        }
    }
};
