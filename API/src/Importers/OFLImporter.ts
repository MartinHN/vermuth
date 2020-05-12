const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');
const path = require('path');
import {FixtureDef} from '../FixtureFactory';


function getValidChannels(o: any) {
  const ac = o.availableChannels;
  const res = new Array<string>();
  if (ac ) {
    for (const k of Object.keys(ac)) {
      res.push(k);
    }
  }
  return res;
}

function getConfigurations(o: any) {
  const res: {[id: string]: any} = {};
  for ( const m of Object.values(o.modes) as any[]) {
    const hasTemplate = m.channels.some((e: any) => (e) && typeof(e) !== 'string');
    if (!hasTemplate  ) { // ignore template for now
      res[m.name] = m.channels;
    }
  }
  return res;

}
function createVermuthFixtureDef(o: any): FixtureDef|undefined {

  try {
    const fixType = o.name;
    const vch = getValidChannels(o);
    const vconf = getConfigurations(o);
    if (vch) {
      const meta = {manufacturer: o.manufacturerKey};
      return new FixtureDef(fixType, o.categories, vch, vconf, meta );
    }


  } catch (err) {
    console.log('parse error on', err, o);
  }

}

function getAllFilePaths(dirPath: string, arrayOfFiles: string[]) {

  const  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file: string) => {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFilePaths(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.json') && !file.endsWith('manufacturers.json')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
}



let OFLfactory: {[id: string]: FixtureDef} = {};
let _inited = false;
export async function initFactory(ressourceDir= '') {

  if (!ressourceDir) {
    ressourceDir = path.join(__dirname, '../../ressources');
  }
  const location = path.join(ressourceDir,'ofl_export_ofl.zip')
  try {
    const folder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'oflImport'));
    const zip = new AdmZip(location);
    // extracts everything
    zip.extractAllTo(folder, /*overwrite*/true);
    console.log('data written to' , folder);
    console.log(fs.readdirSync(folder));
    const allFiles = getAllFilePaths(folder, []);

    OFLfactory  = {};
    for (const f of allFiles) {
      const rawdata = fs.readFileSync(f);
      const jd = JSON.parse(rawdata);
      const o = createVermuthFixtureDef(jd);
      if (o) {
        OFLfactory[o.name] = o;
      }

    }
    _inited = true;


  } catch (e) {
    console.error(e);
  } finally {

  }
  return OFLfactory;


}

export function isInited() {
  return _inited;
}
