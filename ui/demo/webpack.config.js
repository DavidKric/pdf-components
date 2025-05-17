const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const baseConfig = {
  entry: ['./index.tsx', './less/main.less'],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: process.env.NODE_ENV === 'fast',
            },
          },
        ],
      },
      {
        test: /\.js$/,
        include: /node_modules\/react-pdf/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.(less|css)$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true } } },
        ],
      },
      {
        test: /\.(jpg|png)$/,
        type: 'asset/resource',
      },
      {
        test: /\.pdf$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.mjs'],
    alias: {
      // For development, we want to alias the library to the source
      '@allenai/pdf-components': path.resolve(__dirname, '../library/dist'),
      // Ensure only one copy of React is used
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
    fallback: {
      'react/jsx-runtime': require.resolve('react/jsx-runtime')
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      publicPath: '/',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public/**/*',
          filter: absPathToFile => {
            return absPathToFile !== path.resolve(__dirname, 'public', 'index.html');
          },
          transformPath: p => p.replace(/^public\//, ''),
        },
        {
          from: 'node_modules/pdfjs-dist/cmaps/',
          to: 'cmaps/',
        },
        {
          from: 'node_modules/pdfjs-dist/standard_fonts/',
          to: 'standard_fonts/',
        },
        {
          from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          to: 'pdf.worker.min.mjs',
        },
        {
          from: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',
          to: 'pdf.worker.mjs',
        },
      ],
    }),
  ],
  output: {
    filename: '[name].[fullhash:6].js',
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
  },
  optimization: {
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      name: (module, chunks, cacheGroupKey) => {
        return `${cacheGroupKey}-${chunks.map(c => c.name).join('-')}`;
      },
    },
  },
  experiments: {
    outputModule: false,
  },
  devServer: {
    static: { directory: path.join(__dirname, 'public') },
    hot: true,
    host: '0.0.0.0',
    allowedHosts: ['all'],
    historyApiFallback: true,
    port: 3001,
    watchFiles: ['src/**/*', 'public/**/*'],
  },
};

module.exports = baseConfig;
