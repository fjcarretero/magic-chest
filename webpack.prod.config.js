var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: {
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
          }
        ]
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js"),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: false,
        mangle: false
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        _: 'underscore',
        moment: 'moment'
      })
    ]
};
