const path = require( 'path');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');


const isClientBuild = !!process.env["IS_CLIENT"]
const target = isClientBuild?"web":"node"
module.exports= {
  target,
  entry: './src/RootState.ts',
  output: {
    filename: 'main'+(isClientBuild?"client":"server")+".js",
    path: path.resolve(__dirname, 'distPacked'),
  },
  
  module: {
    rules: [
    {
      test: /\.ts$/,
      enforce:"pre",
      use:[ 
      {
        loader: path.resolve(__dirname,'loader/logloader.js'),
        options:{
          suffix:"pre"
        }
      },
      {
        loader: path.resolve(__dirname,'loader/loader.js'),
        options: {
          defines: {"IS_CLIENT":isClientBuild}
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
          transpileOnly: false,
          happyPackMode: false,

        }
      },
      {
        loader: path.resolve(__dirname,'loader/logloader.js'),
        options:{
          suffix:"post"
        }
      },
      ]

    },
    ]
  },
  // plugins:[new ForkTsCheckerWebpackPlugin({checkSyntacticErrors:true})],

  resolve: {
    // enforceExtension:false,
    extensions:[".ts",".js"],
    // modules: [path.resolve(__dirname, 'dist'),path.resolve(__dirname, 'node_modules')]
  }
};