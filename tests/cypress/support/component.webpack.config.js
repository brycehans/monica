const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

const projectRoot = path.resolve(__dirname, '../../..');

module.exports = {
  mode: 'development',
  resolve: {
    alias: {
      vue$: path.join(projectRoot, 'node_modules/vue/dist/vue.esm.js'),
    },
    extensions: ['.js', '.vue', '.json'],
  },
  module: {
    rules: [
      { test: /\.vue$/, loader: 'vue-loader' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: [['@babel/preset-env', { targets: { esmodules: true } }]] },
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
      { test: /\.(png|jpe?g|gif|svg)$/, type: 'asset/resource' },
    ],
  },
  plugins: [new VueLoaderPlugin()],
};
