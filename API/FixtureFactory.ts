import { Fixture } from './Fixture';
import { RemoteFunction, RemoteValue, SetAccessible, AccessibleClass, setChildAccessible, nonEnumerable } from './ServerSync';
const fs = require('fs');

@AccessibleClass()
export class FixtureFactory  {

  constructor(public paths:string[]){
    this.AllFixtures = {}
    this.parseAllJSONs()
  }
  public parseAllJSONs(){
    this.AllFixtures = {}
    const truPaths = paths.filter(p=>fs.exists(p))
    for (const  p of truPaths){
      files = fs.readdirSync(directoryPath, {withFileType:"json"})
      files.forEach( (file) =>{
        const jd = JSON.parse(file)
        const ob = {}
        for( const a of ["name","categories","fixtureKey","modes"]){
          if(a in jd){ob[a] = jd[a]}
        }
        ob["filePath"] = file
        this.AllFixtures[jd.fixtureKey] = ob
        
      });
    });
}
public generateForKey(fixtureKey:string,mode?:string){
  if( fixtureKey in this.AllFixtures){
    const fix = this.AllFixtures
    if(!mode && ("modes" in fix)){
      mode = Object.keys(fix.modes)[0]
    }

  }
} 

public getAvailableFlat(){

}

}
