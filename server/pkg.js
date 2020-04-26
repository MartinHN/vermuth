const { exec: pkg } = require("pkg")
const fs = require('fs')
const path = require('path')

const destOS = process.env.PLATFORM_TARGET
const deployFolder = process.env.DEPLOY_FOLDER || "./deploy"


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
        fs.copyFileSync(l, path.join(deployFolder, path.basename(l)))
    }
}

const supportedTargets = {
    linux: 'linux',
    windows: 'win',
    osx: 'osx'
}


const run = async () => {
    console.log('starting pkg')
    const args = ['.', '--public', '-d', '-t', 'node12-' + supportedTargets[destOS] + '-x64']
    const res = await pkg(args);

    if (fs.existsSync(deployFolder)) {
        deleteFolderRecursive(deployFolder)
    }
    fs.mkdirSync(deployFolder, { recursive: true })

    copyNativeLibs()

    const fileName = fs.readdirSync('.').find(e => e.startsWith("vermuth-server"))
    fs.rename(fileName, path.join(deployFolder, fileName), function (err) {
        if (err) throw err
        console.log('Successfully renamed - AKA moved!')
    })


};

run()

