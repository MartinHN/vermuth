import { FixtureBase } from './Fixture';
import { ChannelBase } from './Channel';
import { RemoteFunction, fetchRemote,RemoteValue, SetAccessible, isClientInstance, AccessibleClass, setChildAccessible, nonEnumerable } from './ServerSync';
const fs = require('fs');

export class FixtureDef{
  constructor (
    public name:string,
    public categories:string[],
    public availableChannels:string[],
    public channelModes?:{[id:string]:string[]},
    public meta:{
      manufacturer?:string,
      baseFactory?:string
    } = {}){

  }
  

  
  get modes(){
    const defaultMode = this.availableChannels
    const confs = this.channelModes || {default:defaultMode};
    if(Object.keys(confs).includes("Default")){
      confs["default"] = confs["Default"]
      delete confs["Default"]
    }

    return confs
  }

  get manufacturer(){
    return this.meta["manufacturer"] || "unknown"
  }
  


  getChannelNameDimForMode(mode:string):{name:string,dim:number}[]{
    if(!Object.keys(this.modes).length){
      return this.availableChannels.map((e,i)=>{return {name:e,dim:i};})
    }
    if(!mode){mode = "default";}
    
    if( !Object.keys(this.modes).includes(mode)){
      mode = Object.keys(this.modes)[0]
    }
    
    const cmode = this.modes[mode]
    const res = new Array<{name:string,dim:number}>()
    for(let ic =0 ;ic<cmode.length ; ic++){
      const cn = cmode[ic]
      if(cn && cn!=null ){
        if(typeof(cn)==="string"){
          res.push({name:cn,dim:ic});
        }
        else{

        }
      }
    }
    return res

  }
  generateFixture(name:string,mode = "default"){
    const nd = this.getChannelNameDimForMode(mode)
    const chs = nd.map(v=>new ChannelBase(v.name,0,v.dim))
    return  new FixtureBase(name,chs,this.name+':'+mode);
    
  }


}
@AccessibleClass()
class FixtureFactoryClass  {
  private __factoryInited = false

  
  @RemoteValue((thisObj,v)=>{
    for(const [fact,fList] of Object.entries(v as FixtureFactoryClass["__fixtureDefs"])){
      for(const [k,f] of Object.entries(fList)){
        thisObj.__fixtureDefs[fact][k] = Object.assign(new FixtureDef("test",[],[]),f)
      }
    }
  })
  private __fixtureDefs: {[id:string]:{[id:string]:FixtureDef}}  = {};
  
  constructor() {

  }

  
  public async init(paths: string[] = []) {

    if(isClientInstance()){
      this.fetchData()
    }
    else{
      if(!this.__factoryInited){
        this.__factoryInited = true

        const basic =  require('./Importers/BasicImporter');
        this.__fixtureDefs["basic"] =  await basic.initFactory();
        const ofl  =require('./Importers/OFLImporter')
        this.__fixtureDefs['ofl'] =await ofl.initFactory();

      }
      Object.freeze(this.__fixtureDefs)
    }
    return this.__fixtureDefs
  }
  public  fetchData(){
    fetchRemote(this,"__fixtureDefs");
  }

  public generateForKey(fixtureKey: string, name: string,mode="default", opts?: any) {
    this.checkInited()
    const spl = fixtureKey.split(":")
    let def
    if(spl && spl.length>1){
      const fact = this.allFixtureDefsByType[spl[0]]
      if(fact){
        def = fact[spl[1]]
      }
    }
    else{
      // def = this.allFixtureDefsFlatMap[fixtureKey];
    }
    if (def) {
      return def.generateFixture(name,opts);

    }
  }

  public checkInited(){
    if (!Object.keys(this.__fixtureDefs).length) {
      throw new Error('trying to generate fixtureKey before init');
    }
  }

  public get allFixtureDefsByType() {
    this.checkInited()
    return this.__fixtureDefs;
  }
  public get allFixturesByManufacturers() {
    this.checkInited();
    const allF = this.allFixtureDefsFlatList
    const res : {[id:string]:FixtureDef[]} = {}
    allF.map(f=>{const man  = f.manufacturer; res[man]? res[man].push(f):(res[man] = [f])});
    return res
  }
  public get allFixtureDefsFlatList() {
    let res = new Array<FixtureDef>();
    for(const cl of Object.values(this.__fixtureDefs)){
      for(const f of Object.values(cl)){
        res.push(f)
      }
    }
    return res;
  }


  public getAllFixtureDefsCategories(){
    const allF = this.allFixtureDefsFlatList
    const categories = new Set<string>()
    allF.map(fd=>{fd.categories.map(e=>categories.add(e))})
    return Array.from(categories)
  }

  public getAllFixturesForCategories(cl:string[]){
    const allF = this.allFixtureDefsFlatList
    if(cl.length===0){
      return allF
    }
    return allF.filter(e=>cl.every(elem => e.categories.indexOf(elem) > -1))

  }
  public getAllFixtureDefsTypeNames(){

    let res = new Array<string>()
    for(const [cl,f] of Object.entries(this.__fixtureDefs)){
      for(const fname of Object.keys(f)){
        res.push(cl+":"+fname)
      }
    }
    return res
  }

}


export const FixtureFactory = new FixtureFactoryClass();
