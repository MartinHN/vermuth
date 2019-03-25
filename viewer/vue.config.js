const VuetifyLoaderPlugin = require("vuetify-loader/lib/plugin");


module.exports = {
  runtimeCompiler: true,
  outputDir: "../server/public",
  configureWebpack: {
    plugins:[
      new VuetifyLoaderPlugin(),
    ]
  }
};