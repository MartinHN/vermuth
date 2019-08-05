import { ChannelBase } from './Channel';
import { Universe } from './Universe';
import { getNextUniqueName } from './Utils';
const EventEmitter = require('events').EventEmitter;
import { RemoteFunction,SetAccessible,AccessibleClass,setChildAccessible } from "./ServerSync"

type ChannelValueType = ChannelBase['__value'];
interface FixtureBaseI {
  name: string;
  enabled: boolean;
}
type FixtureConstructorI  = (...args: any[]) => FixtureBase;
const fixtureTypes: {[key: string]: FixtureConstructorI} = {};

@AccessibleClass()
export class FixtureBase implements FixtureBaseI {



  public enabled = true;
  public globalValue = 0;
  protected ftype = 'base';
  private _baseCirc = 0;
  private __universe: Universe | undefined;
  public events = new EventEmitter()

  @SetAccessible()
  public readonly channels = new Array<ChannelBase>()

  constructor(public name: string, channels: ChannelBase[]) {
    if(channels){
      channels.map(c=>this.addChannel(c))
    }
    else{
      debugger
    }
    
  }

  public static createFromObj(ob: any): FixtureBase |undefined {
    if (ob.channels!==undefined) {
      const cstr = fixtureTypes[ob.ftype];
      if (cstr) {
        const i = cstr(ob.name, []);
        i.configureFromObj(ob)

        return i;
      } else {
        return undefined;
      }
    }
  }
  public configureFromObj(ob: any){

    if(ob.baseCirc!==undefined)this.baseCirc = ob.baseCirc;
    if(ob.channels!==undefined){
      this.channels.map((c:ChannelBase) => this.removeChannel(c))
      ob.channels.map((c: any) => this.addChannel(ChannelBase.createFromObj(c)));
    }
    if(ob.name!=undefined){this.setName(ob.name);}
  }




  public set baseCirc(n: number) {
    this._baseCirc = n;
    this.channels.map( (c) => c.checkDuplicatedCirc());
  }
  public get baseCirc() {return this._baseCirc; }


  get inSync() {
    for (const c of this.channels.filter((cc) => cc.reactToMaster)) {
      if ( c.floatValue !== this.globalValue) { return false; }
    }
    return true;
  }

  public get universe() {
    return this.__universe;
  }

  public set universe(uni: Universe | undefined) {
    this.__universe = uni;
    this.channels.map( (c) => c.setParentFixture(this));
  }




  public setName(n: string) {
    const oldName = this.name
    this.name = n;
    if(oldName!==n){
      this.events.emit('nameChanged',this,oldName)
    }

  }
  public buildAddress(){
    return "/mainUniverse/"+this.name
  }


  @RemoteFunction()
  public setMaster(v: ChannelValueType) {
    this.globalValue = v;
    //debugger
    this.syncToGlobalValue(v);
  }

  public syncToGlobalValue(v: ChannelValueType) {
    if(this.channels){
      for (const c of this.channels) {
        if (c.reactToMaster) {
          c.setValue(v, true);
        }
      }
    }
    else{
      debugger
    }
  }

  public addChannel(c: ChannelBase|undefined) {
    if (c === undefined) {
      c = new ChannelBase('channel', 0, 0, true);
    }
    c.setParentFixture (this);

    this.channels.push(c);
    setChildAccessible(this.channels,""+(this.channels.length-1))
    return c;
  }
  public removeChannel(c: ChannelBase) {
    c.setParentFixture (null);
    const i = this.channels.indexOf(c)
    if(i>=0)this.channels.splice(i,1)// = this.channels.filter((v) => c !== v); // delete?
  }


  public getChannelForName(n: string) {
    return this.channels.find((c) => c.name === n);
  }

  get channelNames() {
    return this.channels.map((c) => c.name);
  }



}


export class DirectFixture extends FixtureBase {

  constructor( channelName: string,  circs: number[] ) {
    super(channelName, circs.map((c) => new ChannelBase('channel', 0, c)));
    this.ftype = 'direct';

  }

}
fixtureTypes.direct = (...args: any[]) => new DirectFixture(args[0], args[1]);


// console.log('started')
// const f = new DirectFixture('lala',[0])
// console.log("setName")
// f.setName("lala")
// const  allCircs  = new Array(512).fill(0).map((_, idx) => idx);
// export const fixtureAll = new DirectFixture('all', allCircs);



