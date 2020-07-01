const path = require("path")
const CompressionPlugin = require('compression-webpack-plugin');
const packageApp = !!process.env["PKG_APP"]

const os = require('os')

const totalmem = Math.floor(os.totalmem() / 1024 / 1024)
const isLowMemPlatform = !!process.env["LOWMEM"] || totalmem < 2048

function rmThread(o, addr) {
  // console.log(o)
  console.log(addr)
  const childMap = o.uses ? o.uses.store : undefined
  if (childMap) {
    for (const o of childMap.keys()) {
      if (o === "thread-loader") {
        console.log('!!!!!!!!!')
      }
    }

    childMap.delete("thread-loader")

    for (const o of childMap.keys()) { rmThread(childMap.get(o), addr + "/" + o); }

  }

}
module.exports = {
  runtimeCompiler: true,
  productionSourceMap: false,
  outputDir: "../server/dist/server/public",
  devServer: {
    disableHostCheck: true
  },
  transpileDependencies: [
    "vuetify"
  ],
  chainWebpack(config) {
    config.optimization.delete('splitChunks')
    config.resolve.alias.delete("@")

    // config
    // .plugin('fork-ts-checker')
    // .tap(args => {
    //     let totalmem; //get OS mem size
    //     let allowUseMem= totalmem>2500? 2048:600;
    //     args[0].memoryLimit = allowUseMem;
    //     return args
    // })
    config.resolve
      .plugin("tsconfig-paths")
      .use(require("tsconfig-paths-webpack-plugin"))

    if (isLowMemPlatform) {
      console.warn("low mem platform, disabling ts check")
      config.plugins.delete("fork-ts-checker")

      config.module
        .rule('ts')
        .use('ts-loader')
        .loader('ts-loader')
        .tap(options => {
          console.warn("transpile only")
          Object.assign(options || {}, { transpileOnly: true, happyPackMode: true })
          return options
        })
      // disable splitting of type checking in type script to enable preprocessing files
      const allM = config.module.rules.store
      // console.log(allM)
      config.resolve.plugins.delete("fork-ts-checker")
      console.log('>>>>>>>>>>>')
      for (const o of allM.keys()) { rmThread(allM.get(o), o) }
    }
    else {
      config.plugin('CompressionPlugin').use(CompressionPlugin, [{ deleteOriginalAssets: !!packageApp }]);
    }





    // const tsLoader = config.module.rule('ts').uses.get("ts-loader")
    // if(!tsLoader)throw "not found ts loader in "+ config.module.rule('ts').uses;
    // tsLoader.tap(args=>{
    //   console.log(args) ; 
    //   args.transpileOnly = false;
    //   args.happyPackMode=false; 
    //   args.silent=false;
    //   args.compilerOptions = {
    //     noEmit: false,
    //     // traceResolution:true,
    //     tsBuildInfoFile:'/tmp/tsbuild',
    //     composite:true,
    //     extendedDiagnostics:true,
    //     generateCpuProfile:'/tmp/cpuProfile'
    //   }
    //   console.log(args) ; 

    //   return args})


    // config.module.rule('ts')
    // .use('loggerloader')
    //   .loader(path.resolve(__dirname,"../API/loader/logloader.js"))
    //   .end()

    // .use('ifdefloader')
    //   .loader(path.resolve(__dirname,"../API/loader/loader.js"))
    //   .options({defines:["IS_CLIENT"]})
    //   .end()


  },
  // pwa: {
  //   name: 'Vermuth'
  // },
};