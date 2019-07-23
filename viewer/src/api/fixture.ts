import { ChannelBase } from './Channel';
import { Universe } from './Universe';
import { getNextUniqueName } from './Utils';
// const EventEmitter = require('events').EventEmitter;
type ChannelValueType = ChannelBase['__value'];
interface FixtureBaseI {
  name: string;
  enabled: boolean;
}
type FixtureConstructorI  = (...args: any[]) => FixtureBase;
const fixtureTypes: {[key: string]: FixtureConstructorI} = {};

export class FixtureBase implements FixtureBaseI {
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
    this.checkNameDuplicate();
    this.channels.map( (c) => c.setParentFixture(this));
  }
  public static fromObj(ob: any): FixtureBase |undefined {
    if (ob.channels) {
      const cstr = fixtureTypes[ob.ftype];
      if (cstr) {
        const i = cstr(ob.name, []);
        i.baseCirc = ob.baseCirc;
        ob.channels.map((c: any) => i.addChannel(ChannelBase.fromObj(c)));

        return i;
      } else {
        return undefined;
      }
    }
  }
  public enabled = true;
  public globalValue = 0;
  protected ftype = 'base';
  private _baseCirc = 0;
  private __universe: Universe | undefined;


  constructor(public name: string, public channels: ChannelBase[]) {

  }
  public setName(n: string) {
    this.name = n;
    this.checkNameDuplicate();
  }

  public checkNameDuplicate() {
    if (this.universe) {
    this.name = getNextUniqueName(this.universe.fixtures.filter((f) => f !== this).map((f) => f.name), this.name);
    }
  }
  public setMaster(v: ChannelValueType) {
    this.globalValue = v;
    this.syncToGlobalValue(v);
  }

  public syncToGlobalValue(v: ChannelValueType) {
    for (const c of this.channels) {
      if (c.reactToMaster) {
      c.setValue(v,true);
    }
    }
  }

  public addChannel(c: ChannelBase|undefined) {
    if (c === undefined) {
      c = new ChannelBase('channel', 0, 0, true);
    }
    c.setParentFixture (this);
    this.channels.push(c);
    return c;
  }
  public removeChannel(c: ChannelBase) {
    c.setParentFixture (null);
    this.channels = this.channels.filter((v) => c !== v);
  }


  public getChannelForName(n: string) {
    return this.channels.find((c) => c.name === n);
  }



}


export class DirectFixture extends FixtureBase {

  constructor( channelName: string,  circs: number[] ) {
    super(channelName, circs.map((c) => new ChannelBase('channel', 0, c)));
    this.ftype = 'direct';

  }

}
fixtureTypes.direct = (...args: any[]) => new DirectFixture(args[0], args[1]);



const  allCircs  = new Array(512).fill(0).map((_, idx) => idx);
export const fixtureAll = new DirectFixture('all', allCircs);



