// simplify formatting of debug module to be readable for both chrome and terminals
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

debugM.formatArgs = formatArgs
debugM.log = console.log.bind(console)

const testF = () => {
    const test = debugM("test")
    test.enabled = true
    for (let i = 0; i < colorLut.length; i++) {
        test.color = i
        test("test " + colorLut[i])
    }
}

// testF()
export default debugM