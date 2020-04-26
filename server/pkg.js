// build.sh
const { exec: pkg } = require("pkg")
const fs = require('fs')
const path = require('path')
const { https } = require('follow-redirects');
const zlib = require('zlib')
const destOS = process.env.PLATFORM_TARGET
const deployFolder = process.env.DEPLOY_FOLDER || "./deploy"
webviewTmpFolder = "/tmp/wvDl"
if (!fs.existsSync(webviewTmpFolder)) {
    fs.mkdirSync(webviewTmpFolder, { recursive: true })
}

const downloadOrGetWv = (target, version, cb) => {
    const buildNames = {
        linux: 'build_linux',
        windows: 'build_windows',
        osx: 'build_macos'
    }
    const buildName = buildNames[target]
    if (!buildName) {
        throw new Error("invalid build name", target)
    }
    const destFolder = path.join(webviewTmpFolder, version)
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true })
    }
    if (fs.existsSync(destFolder)) {
        const destFile = fs.readdirSync(destFolder).find(e => e.includes("webview"))
        if (destFile) {
            cb(undefined, path.join(destFolder, destFile));
            return;
        }
    }
    var download = function (url, dest, cb) {

        var file = fs.createWriteStream(dest);
        var request = https.get(url, function (response) {

            response
                .pipe(file);
            file.on('finish', function () {
                file.close(() => { cb(undefined, dest) });  // close() is async, call cb after close completes.

            });
        }).on('error', function (err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message);
        });
    };
    download(`https://github.com/MartinHN/webview/releases/download/v${version}/${buildName}.zip`,
        path.join(destFolder, buildName + '.zip'),
        cb
    )


}

const deleteFolderRecursive = function (p) {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach((file, index) => {
            const curPath = path.join(p, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
};

function copyNativeLibs() {
    const nativeLibs = [
        "node_modules/serialport/node_modules/@serialport/bindings/build/Release/bindings.node",
    ]
    for (const l of nativeLibs) {
        fs.copyFileSync(l, path.join(deployFolder,path.basename(l)))
    }
}

downloadOrGetWv(destOS, "0.4", async (err, webviewCompress) => {
    if (err) {
        console.error(err)
        return;
    }
    const supportedTargets = {
        linux: 'linux',
        windows: 'win',
        osx: 'osx'
    }

    console.log('starting pkg')
    const args = ['.', '--public', '-t', 'node12-' + supportedTargets[destOS] + '-x64']
    const res = await pkg(args);

    if (fs.existsSync(deployFolder)) {
        deleteFolderRecursive(deployFolder)
    }
    fs.mkdirSync(deployFolder, { recursive: true })
    
    copyNativeLibs()
    console.log('res', webviewCompress)
    var AdmZip = require('adm-zip');

    // reading archives
    var zip = new AdmZip(webviewCompress);
    zip.extractAllTo(path.join(deployFolder, "viewer"), /*overwrite*/true);
    const fileName = fs.readdirSync('.').find(e => e.startsWith("vermuth-server"))
    fs.rename(fileName, path.join(deployFolder, fileName), function (err) {
        if (err) throw err
        console.log('Successfully renamed - AKA moved!')
    })

    // var zipOut = new AdmZip();
    // zipOut.addLocalFolder(deployFolder,'/')
    // zipOut.writeZip(path.join(deployFolder,'out.zip'))

})


