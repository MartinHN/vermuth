// simplify formatting of debug module to be readable and colored in both chrome debugger and terminals when run in non browser, e.g node process debugged with chrome dev tools
// but use default mode if run in browser


const debugM = require('debug')

// const debugMode =  process.env.NODE_ENV !== 'production';
const colorLut = [
    32, 34, 35, // normal
    92, 94, // pastel
    100, 102, 103, 104, 106, // pastel bg
    43, 45, 46, 47 // normal bg
]

function formatArgs(this: any, args: any[]) {

    const { namespace: name, useColors } = (this as any);

    const c = colorLut[(this.color) % colorLut.length];
    const colorCode = `\u001B[${c}m`;
    const endCode = "\u001B[0m"
    const prefix = `${colorCode}${name}${endCode} `;
    args[0] = prefix + args[0].trim();


}

//@ts-ignore
if (typeof window === "undefined") {

    debugM.formatArgs = formatArgs
    // use console log to be visible in chrome dev tools (not only stdout)
    debugM.log = console.log.bind(console)
}

const testF = () => {
    const test = debugM("test")
    test.enabled = true
    for (let i = 0; i < colorLut.length; i++) {
        test.color = i
        test("test " + colorLut[i])
    }
}
const warnLogger = debugM('warn')
warnLogger.enabled = true
const errorLogger = debugM('error')
errorLogger.enabled = true

//@ts-ignore
if (typeof window === "undefined") {
    debugM.error = function (...args: any[]) {
        debugger
        args.unshift("\u001B[31m")
        args.push("\u001B[0m ")
        console.error(...args)
    }
    debugM.warn = function (...args: any[]) {
        args.unshift("\u001B[33m")
        args.push("\u001B[0m ")
        console.warn(...args)
    }

} else {
    debugM.error = console.error.bind(console)
    debugM.warn = console.warn.bind(console)
}

debugM.assert = function(v: boolean,...args: any[]){
    if(!v){
        this.error(args)
    }
}
testF()

export default debugM