const path = require( 'path');

// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const nodeExternals = require('webpack-node-externals')

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');


module.exports= {
  target:"node",
  entry: path.resolve(__dirname,'src/server.ts'),
  output: {
    filename: 'mainServer.js',
    path: path.resolve(__dirname, 'distPacked'),
  },
  node: {
    // Need this when working with express, otherwise the build fails
    __dirname: false,   // if you don't put this is, __dirname
    __filename: false,  // and __filename return blank or /
  },
  externals: [nodeExternals()],
  module: {
    rules: [
    {
      test: /\.ts$/,
      enforce:"pre",
      use:[ 
      {
        loader: path.resolve(__dirname,'../API/loader/logloader.js'),
        options:{
          suffix:"pre"
        }
      },
      {
        loader: path.resolve(__dirname,'../API/loader/loader.js'),
        options: {
          defines: {"IS_CLIENT":false}
        },
      }
      ]

    },
    {
      test: /\.ts$/,
      use: [
      // "thread-loader",
      {
        loader: path.resolve('../viewer/node_modules/ts-loader/index.js'),
        options: {
          transpileOnly: true,
          happyPackMode: true,

        }
      },
      ]

    },
    {
      test: /\.js$/, //Regular expression 
     // exclude: /(node_modules|bower_components)/,//excluded node_modules 
      use: {
      loader: "babel-loader", 
      options: {
        presets: ["@babel/preset-env"]  //Preset used for env setup
       }
      }
     }
    ]
  },
  // plugins:[new ForkTsCheckerWebpackPlugin({checkSyntacticErrors:true})],

  resolve: {
    // enforceExtension:false,
    plugins:[
      new TsconfigPathsPlugin({configFile:path.resolve(__dirname,'tsconfig.json'),})
    ],
    extensions:[".ts",".js"],
    // modules: [path.resolve(__dirname, 'dist'),path.resolve(__dirname, 'node_modules')]
  },
  optimization:{
        minimize: false, 
      }
};