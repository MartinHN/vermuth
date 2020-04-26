const server = require('./distPacked/mainServer.js')

console.log('+++++++++++++++++start viewer')
// var exec = require('child_process').execFile;
const open = require('open')
const path = require("path")
const os = require('os')
const fs = require('fs')
const viewerFolder = path.join(process.cwd(), 'viewer')

var findViewer = () => {
    if (fs.existsSync(viewerFolder)) {
        const l = fs.readdirSync(viewerFolder);
        const exePath = l.find(e => ["webview.exe", "webview"].includes(e))
        if (exePath) {
            return path.join(viewerFolder, exePath)
        }
    }
}
function getPlatformCode() {
    if (os.platform === 'darwin') {
        return 'macos'
    }
    if (os.platform === 'linux') {
        return 'linux'
    }
    return 'windows'
}

const tryChrome = true
const ChromeLauncher = require('chrome-launcher');
const serverAddress = "http://localhost:3000"


try {
    ChromeLauncher.launch({
        startingUrl: serverAddress,
        chromeFlags: ['--disable-gpu','--app='+serverAddress]
    }).then(chrome => {
        console.log(`Chrome debugging port running on ${chrome.port}`);
        chrome.process.on('exit', () => {
            console.log("viewer quitted")
            process.exit(0)
        });
    });
}
catch {

    console.error('no chrome candidate found trying system navigator')

    open(serverAddress, { wait: true }).then((childProcess) => {
        console.log("viewer opened")
        childProcess.on('exit', () => {
            console.log("viewer quitted")
            process.exit(0)
        });
    })



}



// }
// )()



// const viewerExe = findViewer ()
// if(!viewerExe){
//     // TODO download it from github
//     console.error("can't find viewer in ", viewerFolder)
// }

// fs.chmodSync(viewerExe,'755')

// exec(viewerExe, function(err, data) {  
//         if(err)console.log("viewer error",err)
//         if(data)console.log("viewer data",data.toString());                       
// });  
