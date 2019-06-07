import { getNextUniqueName } from './Utils';
import { FixtureBase } from './Fixture';

type ChannelValueType = number; // |number[];

export interface ChannelI {
  ctype: string;
  name: string;
  // private __value: ChannelValueType;
  enabled: boolean;
  circ: number;

  setValue(v: ChannelValueType): boolean;
  setValueInternal(v: ChannelValueType): boolean;
}



type ChannelConstructorI  = new (...args: any[]) => ChannelBase;


const channelTypes: {[key: string]: ChannelConstructorI} = {};

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

  public static fromObj(ob: any): ChannelBase|undefined {
    const cstr = channelTypes[ob.ctype];
    if (cstr) {
      const c =  new cstr(ob.name, ob.value, ob.circ);
      c.reactToMaster = ob.reactToMaster;
      return c;
    } else {
      return undefined;
    }

  }
  public ctype = 'base';
  public hasDuplicatedCirc = false;
  public reactToMaster = true;
  private __parentFixture: any;

  constructor(public name: string, private __value: ChannelValueType = 0 , public circ: number= 0, public enabled: boolean= true) {

  }
  public setValue(v: ChannelValueType) {
    return this.setFloatValue(v);
  }
  public setFloatValue(v: number) {
    if (this.__value !== v) {
      this.__value = v;
      UniverseListener.notify(this.trueCirc, this.__value);
      return true;
    } else {
      return false;
    }
  }

  public setIntValue(nvalue: number) {
    return this.setFloatValue(nvalue / 255);
  }

  public setCirc(n: number) {
    this.circ = n;
    this.checkDuplicatedCirc();
  }

  public setName( n: string ) {
    this.name = n;
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
      for ( const f of this.__parentFixture.universe.fixtures) {
        for ( const cc of f.channels) {
          if ( this !== cc && cc.trueCirc === this.trueCirc) {
            this.hasDuplicatedCirc = true; return;
          }
        }
      }
    }
    this.hasDuplicatedCirc = false;
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

class UniverseListenerClass {
  public setListener(f: (c: number, v: number) => void) {
    this.listener = f;
  }
  public notify(c: number, v: number) {
    this.listener(c, v);

  }
  private listener: (c: number, v: number) => void = () => {};
}
export const UniverseListener = new UniverseListenerClass();





