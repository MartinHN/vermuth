import { getNextUniqueName } from './Utils';
import { FixtureBase } from './Fixture';
import { RemoteFunction, RemoteValue, nonEnumerable, AccessibleClass } from './ServerSync';
type ChannelValueType = number; // |number[];

export interface ChannelI {
  ctype: string;
  name: string;
  // private __value: ChannelValueType;
  _enabled: boolean;
  circ: number;

  setValue(v: ChannelValueType, doNotify: boolean): boolean;
  setValueInternal(v: ChannelValueType): boolean;

}



type ChannelConstructorI  = new (...args: any[]) => ChannelBase;


const channelTypes: {[key: string]: ChannelConstructorI} = {};

@AccessibleClass()
export class ChannelBase implements ChannelI {

  get trueCirc() {
    let baseCirc = 0;
    if (this.__parentFixture && this.__parentFixture.baseCirc) {
      baseCirc = this.__parentFixture.baseCirc;
    }
    return baseCirc + this.circ;
  }
  get intValue() {return this.__value * 255; }
  get floatValue() {return this.__value; }
  public set enabled(v: boolean) {
    this._enabled = v;
  }
  public get enabled() {
    return this._enabled;
  }

  public static createFromObj(ob: any): ChannelBase|undefined {
    const cstr = channelTypes[ob.ctype];
    if (cstr) {
      const c =  new cstr(ob.name, ob.value, ob.circ);
      c.configureFromObj(ob);
      return c;
    } else {
      return undefined;
    }
  }

  public ctype = 'base';
  public hasDuplicatedCirc = false;
  public reactToMaster = true;
  @nonEnumerable()
  private __parentFixture: any;

  private __value: ChannelValueType = 0;

  constructor(public name: string, __value: ChannelValueType  , public circ: number= 0, public _enabled: boolean= true) {
    if(!__value)__value = 0 // ensure numeric
    this.setValueChecking(__value)
  }

  public configureFromObj(ob: any) {
    if (ob.name !== undefined) {this.name = ob.name; }
    if (ob.value !== undefined) {this.setValue( ob.value, false); }
    if (ob.circ !== undefined) {this.setCirc( ob.circ); }
    if (ob.reactToMaster !== undefined) {this.reactToMaster = ob.reactToMaster; }
  }

  @RemoteFunction()
  public setValue(v: ChannelValueType, doNotify: boolean) {
    return this.setFloatValue(v, doNotify);
  }
  @RemoteFunction()
  public setFloatValue(v: number, doNotify: boolean) {
    if (Number.isNaN(v)) {
      console.error('Nan error');
      return false;
    }
    if (this.__value !== v) {

      this.setValueChecking(v);
      if (doNotify) {UniverseListener.notify(this.trueCirc, this.__value); }
      return true;
    } else {
      return false;
    }
  }

  public setIntValue(nvalue: number, doNotify: boolean) {
    return this.setFloatValue(nvalue / 255, doNotify);
  }

  public setCirc(n: number) {
    this.circ = n;
    this.checkDuplicatedCirc();
  }

  public setName( n: string ) {
    this.name = n;
    this.reactToMaster = !['r', 'g', 'b'].includes(this.name);
    this.checkNameDuplicate();

  }
  public checkNameDuplicate() {
    if (this.__parentFixture) {
      this.name = getNextUniqueName(this.__parentFixture.channels.filter( (c: ChannelBase) => c !== this).map((c: ChannelBase) => c.name), this.name);
    }
  }

  public setValueInternal(v: ChannelValueType) {return true; }

  public setParentFixture(f: FixtureBase|null) {
    this.__parentFixture = f;
    this.checkNameDuplicate();
    this.checkDuplicatedCirc();
  }

  public checkDuplicatedCirc() {
    if (this.__parentFixture && this.__parentFixture.universe ) {
      for ( const f of this.__parentFixture.universe.fixtureList) {
        for ( const cc of f.channels) {
          if ( this !== cc && cc.trueCirc === this.trueCirc) {
            this.hasDuplicatedCirc = true; return;
          }
        }
      }
    }
    this.hasDuplicatedCirc = false;
  }

  private setValueChecking(__value){
    if(__value===undefined){
      debugger
      console.error("undefined val")
      this.__value = 0;
    }
    else{
      this.__value = __value;
    }
  }


}
// register type
channelTypes.base =  ChannelBase.prototype.constructor as new (...args: any[]) => ChannelBase;


export class LogChannel extends ChannelBase {
  public ctype = 'logChanel';
  public setValueInternal( v: ChannelValueType) {
    console.log('set channel' + v);
    return true;
  }

}

const EventEmitter = require( 'events' );
class UniverseListenerClass extends EventEmitter {
  public setListener(f: (c: number, v: number) => void) {
    this.listener = f;
  }
  public notify(c: number, v: number) {
    this.emit('channelChanged', c, v);

  }
  private listener: (c: number, v: number) => void = () => {};
}
export const UniverseListener = new UniverseListenerClass();





