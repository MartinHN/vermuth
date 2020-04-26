const server = require('./distPacked/mainServer.js')

console.log('+++++++++++++++++start viewer')
var exec = require('child_process').execFile;
const path = require("path")
const os = require('os')
const fs = require('fs')
const viewerFolder = path.join(process.cwd(),'viewer')

var findViewer = ()=>{
    if(fs.existsSync(viewerFolder)){
        const l = fs.readdirSync(viewerFolder);
        const exePath =  l.find(e=>["webview.exe","webview"].includes(e))
        if(exePath){
            return path.join(viewerFolder,exePath)
        }
    }
}
function getPlatformCode(){
    if(os.platform==='darwin'){
        return 'macos'
    }
    if(os.platform==='linux'){
        return 'linux'
    }
    return 'windows'
}
const viewerExe = findViewer ()
if(!viewerExe){
    // TODO download it from github
    console.error("can't find viewer in ", viewerFolder)
}

fs.chmodSync(viewerExe,'755')

exec(viewerExe, function(err, data) {  
        if(err)console.log("viewer error",err)
        if(data)console.log("viewer data",data.toString());                       
});  
