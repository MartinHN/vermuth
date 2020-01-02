import * as ofl from "@API/Importers/OFLImporter"
var testing = require('testing');

export async function testCompat(callback){
// const path = "/tmp/ofl_export_ofl"
console.log(ofl)
const allF = await ofl.initFactory()
console.log(allF)
testing.assert(allF && Object.keys(allF).length>0,'empty factory',callback);
testing.success(callback)
}

