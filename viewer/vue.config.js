module.exports = {
  runtimeCompiler: true,
  outputDir: "../server/dist/server/public",

  chainWebpack(config) {
    config.resolve.alias.delete("@")
    config.resolve
      .plugin("tsconfig-paths")
      .use(require("tsconfig-paths-webpack-plugin"))
  },
  pwa: {
    name: 'Conduktor'
  }
};