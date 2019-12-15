import { FixtureBase } from './Fixture';
import { RemoteFunction, RemoteValue, SetAccessible, AccessibleClass, setChildAccessible, nonEnumerable } from './ServerSync';
const fs = require('fs');

const directoryPath = '';
@AccessibleClass()
export class FixtureFactory  {
  public AllFixtures: any = {};
  constructor(public paths: string[]) {

    this.parseAllJSONs();
  }
  public parseAllJSONs() {
    this.AllFixtures = {};
    const truPaths = this.paths.filter((p) => fs.exists(p));
    for (const  p of truPaths) {
      const files = fs.readdirSync(directoryPath, {withFileType: 'json'});
      files.forEach( (file) => {
        const jd = JSON.parse(file);
        const ob = {filepath: file};
        for ( const a of ['name', 'categories', 'fixtureKey', 'modes']) {
          if (Object.keys(jd).includes(a)) {ob[a] = jd[a]; }
        }

        this.AllFixtures[jd.fixtureKey] = ob;

    });
    }
  }
  public generateForKey(fixtureKey: string, mode?: string) {
    if (Object.keys(this.AllFixtures).includes(fixtureKey)) {
      const fix = this.AllFixtures;
      if (!mode && ('modes' in fix)) {
        mode = Object.keys(fix.modes)[0];
      }

    }
  }

  public getAvailableFlat() {

  }

}
