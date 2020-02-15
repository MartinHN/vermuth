const loader = require( "./loader/loader")
const fs = require('fs');
const os = require('os');
const path = require('path');

var nodemon = require('nodemon');

// const nodemonProcess = nodemon({
//   // script: 'echo "running"',
//   ext: 'ts js json',
//   watch: [
//   "src"
//   ],
//   ext: "ts",
//   exec: 'echo "lala"'
// });


const srcPath = path.resolve('./src')
console.log(srcPath)
const dryRun = true;
function generate(fileList){
  generateOne(true,fileList);
  generateOne(false,fileList);
}

function generateOne(is_client,fileList){
  // console.log(nodemonProcess);
  const shouldRebuildAll = !fileList
  
  if(shouldRebuildAll){
    const destPath = path.resolve('./gen/'+is_client?'client':'server')
    console.log('removing folder ',destPath)
    if(destPath.length>4 && !dryRun){
      fs.rmdirSync(destPath, { recursive: true });
    }
    fs.mkdirSync(destPath)
    
    walk(srcPath,(path,_)=>{
      const rP = path.relative(srcPath, path)
      console.log(rP);
      if(shouldRebuildAll || fileList.includes(path)){

      }
    })
  
  }



  
}

generate();
fs.watch(srcPath,{recursive:true},(fl)=>{generate(fl);})

// nodemon.on('start', function () {
//   console.log('App has started');
//   generate()
// }).on('quit', function () {
//   console.log('App has quit');
//   process.exit();
// }).on('restart', function (files) {
//   console.log('App restarted due to: ', files);

// });





//////////////

// Utils


function walk(dir, callback) {
  fs.readdir(dir, function(err, files) {
    if (err) throw err;
    files.forEach(function(file) {
      var filepath = path.join(dir, file);
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

