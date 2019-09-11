import { ChannelBase } from './Channel';
import { Universe } from './Universe';
import { getNextUniqueName } from './Utils';
const EventEmitter = require('events').EventEmitter;
import { RemoteFunction, RemoteValue, SetAccessible, AccessibleClass, setChildAccessible, nonEnumerable } from './ServerSync';

type ChannelValueType = ChannelBase['__value'];
interface FixtureBaseI {
  name: string;
  enabled: boolean;
}
type FixtureConstructorI  = (...args: any[]) => FixtureBase;
const fixtureTypes: {[key: string]: FixtureConstructorI} = {};

@AccessibleClass()
export class FixtureBase implements FixtureBaseI {


  public set baseCirc(n: number) {
    const changed = n !== this._baseCirc;
    this._baseCirc = n;

    if (this.universe && changed) {
      this.universe.checkDuplicatedCirc();
      this.universe.updateChannelsValues();
    }
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

  get channelNames() {
    return this.channels.map((c) => c.name);
  }
  get channelsState() {
    return this.channels.map((c) => c.getState());
  }

  public static createFromObj(ob: any): FixtureBase |undefined {
    if (ob.channels !== undefined) {
      const cstr = fixtureTypes[ob.ftype];
      if (cstr) {
        const i = cstr(ob.name, []);
        i.configureFromObj(ob);

        return i;
      } else {
        return undefined;
      }
    }
  }



  @RemoteValue()
  public enabled = true;
  @RemoteValue()
  public globalValue = 0;

  @nonEnumerable()
  public __events = new EventEmitter();

  @SetAccessible()
  public readonly channels = new Array<ChannelBase>();
  protected ftype = 'base';

  @RemoteValue()
  private _baseCirc = 0;

  @nonEnumerable()
  private __universe: Universe | undefined;

  constructor(public name: string, channels: ChannelBase[]) {

    if (channels) {
      channels.map((c) => this.addChannel(c));
    } else {
      debugger;
    }

  }
  public configureFromObj(ob: any) {

    if (ob._baseCirc !== undefined) {this.baseCirc = ob._baseCirc; }
    if (ob.channels !== undefined) {
      this.channels.map((c: ChannelBase) => this.removeChannel(c));
      ob.channels.map((c: any) => this.addChannel(ChannelBase.createFromObj(c)));
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

  public get colorChannels() {
    const cch: any = {};
    for (const ch of this.channels ) {
      if (ch.roleFam === 'color') {
        cch[ch.roleType] = ch;
      }
    }
    return cch as {r?: ChannelBase, g?: ChannelBase, b?: ChannelBase} ;
  }

  public get hasColorChannels() {
    const ch = this.colorChannels;
    return (ch.r) && (ch.g) && (ch.b);
  }

  public get dimmerChannel() {
    return this.channels.find((e) => e.name === 'dim' || e.name === 'dimmer');
  }

  @RemoteFunction({sharedFunction: true})
  public setMaster(v: ChannelValueType) {
    this.globalValue = v;
    // debugger
    this.syncToGlobalValue(v);
  }

  @RemoteFunction({sharedFunction: true})
  public setColor(c: {r: number, g: number, b: number}) {
    if (this.colorChannels !== {}) {
      if (this.colorChannels.r) {this.colorChannels.r.setValue(c.r, false); }
      if (this.colorChannels.g) {this.colorChannels.g.setValue(c.g, false); }
      if (this.colorChannels.b) {this.colorChannels.b.setValue(c.b, false); }
    }

  }


  public syncToGlobalValue(v: ChannelValueType) {
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

  public addChannel(c: ChannelBase|undefined) {
    if (c === undefined) {
      c = new ChannelBase('channel', 0, 0, true);
    }
    c.setParentFixture (this);
    this.channels.push(c);
    setChildAccessible(this.channels, '' + (this.channels.length - 1));
    return c;
  }


  public removeChannel(c: ChannelBase) {
    c.setParentFixture (null);
    const i = this.channels.indexOf(c);
    if (i >= 0) {this.channels.splice(i, 1); }// = this.channels.filter((v) => c !== v); // delete?
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


// console.log('started')
// const f = new DirectFixture('lala',[0])
// console.log("setName")
// f.setName("lala")
// const  allCircs  = new Array(512).fill(0).map((_, idx) => idx);
// export const fixtureAll = new DirectFixture('all', allCircs);



