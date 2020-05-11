const ifdefloader = require( "./loader/ifdef")
const fs = require('fs');
const os = require('os');
const path = require('path');
const _ = require('lodash')


const srcPath = path.resolve('./src')
const dryRun = false;
const extToInclude = ['.ts']


function transform(filePath,destPath,defines){
  const source=fs.readFileSync(filePath,'utf-8')
  const nS = ifdefloader(source,defines)
  // console.log(destPath,">>",nS)
  if(!dryRun){
    const encDir = path.dirname(destPath)
    if(!fs.existsSync(encDir)){
      fs.mkdirSync(encDir,{ recursive: true })
    }
      fs.writeFileSync(destPath,nS,'utf-8')
  }

  
}

function generateOne(is_client,fileList){
  const shouldRebuildAll = !fileList
  const destPath = path.resolve(srcPath+'/../gen/'+(is_client?'client':'server')+'/')
  console.log(destPath)
  if(shouldRebuildAll){
    console.log('cleaning folder ',destPath)
    if(destPath.length>4 && !dryRun){
      fs.rmdirSync(destPath, { recursive: true });
    }
    fs.mkdirSync(destPath,{ recursive: true })
  }

  walk(srcPath,(fpath,_)=>{
    if(extToInclude.includes(path.extname(fpath))){
      const rP = path.relative(srcPath, fpath)
      const dP = destPath+'/'+rP;
      // console.log(rP,dP,fpath);
      
      if(shouldRebuildAll || fileList.includes(rP)){
        if(!shouldRebuildAll){
        console.log("selected file",rP)
      }
        transform(fpath,dP,{IS_CLIENT:is_client})
      }
    }
  })

}

function generate(fileList){
  console.log("generating for",fileList);
  generateOne(true,fileList);
  generateOne(false,fileList);
  console.log("end generating for",fileList);
}







let toGen = []
const genDebounced = _.debounce(
  ()=>{
    if(toGen){generate(toGen);}
    toGen = []
  },10)

const genAllDebounced = _.debounce(generate,10)


/////////
// Main

generate();
if(process.env.GEN_ONCE){
return;
}
const watch = require('node-watch');
watch(srcPath,{recursive:true,persistent:true},(evt,fn)=>{
  console.log("watchEvent",evt,fn);
  if(evt==="change" || evt==="update"){

    // const fnn = srcDir+'/'+fn
    
    // if(fs.lstatSync(srcDir+'/'+fl).isDirectory()){

      // }
      if(extToInclude.includes(path.extname(fn))){
        if(path.isAbsolute(fn)){
          console.warn("absolute path",fn)
          fn = fn.split("API/src/")[1]
          console.warn("relative path",fn)
        }
        toGen.push(fn)
        genDebounced()
      }
      else{
        console.warn('ignored change',fn)
      }

    }
    else{
      console.warn('unknown event rebuilding all',fn)
      genAllDebounced()
    }
  })



//////////////

// Utils


function walk(dir, callback) {
  fs.readdir(dir, function(err, files) {
    if (err) throw err;
    files.forEach(function(file) {
      const filepath = path.join(dir, file);
      fs.stat(filepath, function(err,stats) {
        if (stats.isDirectory()) {
          walk(filepath, callback);
        } else if (stats.isFile()) {
          callback(filepath, stats);
        }
      });
    });
  });
}

