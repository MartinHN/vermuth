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

  public set universe(uni: Universe | null) {
    this.__universe = uni;
    this.channels.map( (c) => c.setParentFixture(this));
  }

  get channelNames() {
    return this.channels.map((c) => c.name);
  }
  get channelsState() {
    return this.channels.map((c) => c.getState());
  }
  public get colorChannels() {
    return this.getChannelsOfRole('color');
  }
  public get positionChannels() {
    return this.getChannelsOfRole('position');
  }

  public get dimmerChannels() {
    return this.getChannelsOfRole('dim');
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
  private __universe: Universe | null = null;

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

  public  getChannelsOfRole(n: string) {
    const cch: any = {};
    for (const ch of this.channels ) {
      if (ch.roleFam === n) {
        cch[ch.roleType] = ch;
      }
    }
    return cch ;
  }

  public hasChannelsOfRole(n: string) {
    const ch = this.getChannelsOfRole(n);
    return ch &&  Object.keys(ch).length > 0 ;

  }

  @RemoteFunction({sharedFunction: true})
  public setMaster(v: ChannelValueType) {
    this.globalValue = v;
    // debugger
    this.syncToGlobalValue(v);
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



