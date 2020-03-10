import {EventEmitter} from 'events';
import { ChannelBase } from './Channel';
import { Universe } from './Universe';
import { getNextUniqueName } from './Utils';
import { buildEscapedObject } from './SerializeUtils';

import { RemoteFunction, RemoteValue, SetAccessible, AccessibleClass, setChildAccessible, nonEnumerable } from './ServerSync';

type ChannelValueType = ChannelBase['__value'];
export interface FixtureBaseI {
  name: string;
  baseCirc: number;

}
type FixtureConstructorI  = (...args: any[]) => FixtureBase;
const fixtureTypes: {[key: string]: FixtureConstructorI} = {};

@AccessibleClass()
export class FixtureBase implements FixtureBaseI {


  public set baseCirc(n: number) {
    if(isNaN(n)){debugger;return;}
    if(n===0){n=1;debugger;}
    this.__setBaseCirc(n);
  }
  public get baseCirc() {return this._baseCirc; }


  

  public get universe() {
    return this.__universe;
  }

  public set universe(uni: Universe | null) {
    this.__universe = uni;
    this.channels.map( (c) => c.setParentFixture(this));
  }
  get groupNames(){
    return this.universe?this.universe.getGroupsForFixture(this):[]
  }
  get channelNames() {
    return this.channels.map((c) => c.name);
  }
  get channelsState() {
    return this.channels.map((c) => c.getState());
  }
  public get colorChannels() {
    return this.getUniqueChannelsOfRole('color');
  }
  public get positionChannels() {
    return this.getUniqueChannelsOfRole('position');
  }

  public get dimmerChannels() { 
    return this.getChannelsOfRole('dim')["dimmer"];
  }
  

  

  public get enabled() {return this.channels.some((c) => c.enabled); }

  get span() {
    let span = 0;
    for (const c of this.channels) {
      span = Math.max(c.circ + 1, span);
    }
    return span;
  }
  get fixtureType() {
    return this.ftype;
  }

  get endCirc() {
    return this.span + this._baseCirc - 1;
  }

  public static createFromObj(ob: any): FixtureBase |undefined {
    if (ob.channels !== undefined) {
      const cstr = fixtureTypes[ob.ftype];
      if (cstr) {
        const i = cstr(ob.name, []);
        i.configureFromObj(ob);

        return i;
      } else {
        const res = new FixtureBase('temp', []);
        res.configureFromObj(ob);
        return res;
      }
    }
  }
  
  private pdimmerValue= 0;

  

  @nonEnumerable()
  public __events = new EventEmitter();

  @SetAccessible({readonly: true})
  public readonly channels = new Array<ChannelBase>();

  // protected ftype = 'base';

  @RemoteValue()
  private _baseCirc = 0;

  @nonEnumerable()
  private __universe: Universe | null = null;

  constructor(public name: string, channels: ChannelBase[], protected ftype= 'base') {

    if (channels) {
      channels.map((c) => this.addChannel(c));
    } else {
      debugger;
    }

  }


  public clone() {
    const res =  FixtureBase.createFromObj(buildEscapedObject(this)) as FixtureBase;
    res.ftype = this.ftype;
    return res;
  }

  public configureFromObj(ob: any) {

    if (ob._baseCirc !== undefined) {this.baseCirc = ob._baseCirc; }
    this.channels.map((c: ChannelBase) => this.removeChannel(c));
    if (ob.channels !== undefined) {
      ob.channels.map((c: any) => this.addChannel(ChannelBase.createFromObj(c, this)));
    }
    if (ob.name !== undefined) {this.setName(ob.name); }
  }

  public setName(n: string) {
    const oldName = this.name;
    this.name = n;
    if (oldName !== n) {
      this.__events.emit('nameChanged', this, oldName);
    }

  }

  public hasChannelMatchingFilters(fl: string[]) {
    if (fl.length === 0) {
      return true;
    } else if (fl.some((e) => 'all' === e)) {
      return  true;
    }
    return Object.values(this.channels).some((e) => fl.some((f) => e.matchFilter(f)));
  }
  public buildAddress() {
    return '/mainUniverse/' + this.name;
  }

  public  getChannelsOfRole(n: string) :{[id:string]:ChannelBase[]}{
    const cch: {[id:string]:ChannelBase[]} = {};
    for (const ch of this.channels ) {
      if (ch.roleFam === n) {
        if (Object.keys(cch).includes(ch.roleType)) {
          // if (!cch[ch.roleType].length) {
          //   cch[ch.roleType] = [cch[ch.roleType]];
          // }
          cch[ch.roleType].push(ch);

        } else {
        cch[ch.roleType] = [ch];
        }
      }
    }
    return cch ;
  }
  public  getUniqueChannelsOfRole(n: string) :{[id:string]:ChannelBase}{
    const cch: {[id:string]:ChannelBase} = {};
    for (const ch of this.channels ) {
      if (ch.roleFam === n) {
        if (Object.keys(cch).includes(ch.roleType)) {
          // if (!cch[ch.roleType].length) {
          //   cch[ch.roleType] = [cch[ch.roleType]];
          // }
          console.error("not unique, ignoring" ,ch.roleType)
          // cch[ch.roleType].push(ch);

        } else {
        cch[ch.roleType] = ch;
        }
      }
    }
    return cch ;
  }

  public hasChannelsOfRole(n: string) {
    const ch = this.getChannelsOfRole(n);
    return ch &&  Object.keys(ch).length > 0 ;

  }

  public hasActiveChannels(){
    return (this.dimmerChannels || this.channels).some((c) => c.floatValue > 0)
  }


  public get dimmerValue(){
    return this.pdimmerValue;
  } 
  
  
  public set dimmerValue(v: ChannelValueType) {
    if(isNaN(v)){debugger;return;}
    this.pdimmerValue = v;
    if (this.channels) {
      for (const c of this.channels) {
        if (c.reactToMaster) {
          c.setValue(v, true);
        }
      }
    } else {
      debugger;
    }
  }
  @RemoteFunction({sharedFunction: true})
  public setMaster(v:ChannelValueType){
    this.dimmerValue = v;
  }

  
  public get dimmerInSync(){
    for (const c of this.channels.filter((cc) => cc.reactToMaster)) {
      if ( c.floatValue !== this.dimmerValue) { return false; }
    }
    return true;
  }

  @RemoteFunction({sharedFunction: true})
  public setColor(c: {r: number, g: number, b: number}, setWhiteToZero: boolean) {
    const cch = this.colorChannels;
    if (cch !== {}) {
      if (cch.r) {this.setCoarseAndFine(c.r, cch.r, cch.r_fine); }
      if (cch.g) {this.setCoarseAndFine(c.g, cch.g, cch.g_fine); }
      if (cch.b) {this.setCoarseAndFine(c.b, cch.b, cch.b_fine); }
      if (setWhiteToZero && cch.w) {this.setCoarseAndFine(0, cch.w, cch.w_fine); }
    }
  }

  @RemoteFunction({sharedFunction: true})
  public getColor(includeWhite=true) {
    const res:{r:number,g:number,b:number,w?:number} = {r: 0, g: 0,b:0};
    const cch = this.colorChannels;
    if (cch !== {}) {
      if (cch.r) res.r = this.getCoarseAndFine( cch.r, cch.r_fine);
      if (cch.g) res.g = this.getCoarseAndFine( cch.g, cch.g_fine);
      if (cch.b) res.b = this.getCoarseAndFine( cch.b, cch.b_fine);
      if (includeWhite && cch.w) {res.w = this.getCoarseAndFine( cch.w, cch.w_fine); }
    }
    return res
  }


  @RemoteFunction({sharedFunction: true})
  public setPosition(c: {x: number, y: number}) {
    const pch = this.positionChannels;
    if (pch !== {}) {
      if (pch.pan) {this.setCoarseAndFine(c.x, pch.pan, pch.pan_fine); }
      if (pch.tilt) {this.setCoarseAndFine(c.y, pch.tilt, pch.tilt_fine); }

    }

  }
  public getPosition() {
    const res = {x: 0, y: 0};
    const pch = this.positionChannels;
    if (pch !== {}) {
      if (pch.pan) {res.x = this.getCoarseAndFine( pch.pan, pch.pan_fine); }
      if (pch.tilt) {res.y = this.getCoarseAndFine( pch.tilt, pch.tilt_fine); }
    }
    return res;
  }


  

  public addChannel(c: ChannelBase|undefined) {
    if (c === undefined) {
      c = new ChannelBase('channel', 0, this.span, true);
    }
    c.setParentFixture (this);
    this.channels.push(c);
   // setChildAccessible(this.channels, '' + (this.channels.length - 1));
    return c;
  }


  public removeChannel(c: ChannelBase) {
    c.__dispose();
    c.setParentFixture (null);
    const i = this.channels.indexOf(c);
    if (i >= 0) {this.channels.splice(i, 1); }// = this.channels.filter((v) => c !== v); // delete?
  }


  public getChannelForName(n: string) {
    return this.channels.find((c) => c.name === n);
  }

  @RemoteFunction({sharedFunction: true})
  private __setBaseCirc(n: number) {
    const changedDiff = n - this._baseCirc;
    this._baseCirc = n;

    if (this.universe && changedDiff !== 0) {

      this.universe.checkDuplicatedCirc();
      this.universe.updateChannelsValues();
    }
  }

  private setCoarseAndFine(v: number, c: ChannelBase|undefined, cf: ChannelBase|undefined, doNotify: boolean = true) {
    if (!c) {return; }

    if (cf !== undefined) {
      const q = 255;
      const qV = v * q;
      const flooredV = Math.floor(qV);
      c.setValue(flooredV / q, doNotify);
      const fine = (qV - flooredV) ;
      cf.setValue(fine, doNotify);
    } else {
      c.setValue(v, doNotify);
    }

  }
  private getCoarseAndFine(c: ChannelBase|undefined, cf: ChannelBase|undefined) {
    if (!c) {return 0; }

    if (cf !== undefined) {
      const q = 255;
      return  (c.intValue + cf.intValue / q) / q;
    } else {
      return c.floatValue;
    }

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



