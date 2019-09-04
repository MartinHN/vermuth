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




  public ctype = 'base';
  public hasDuplicatedCirc = false;
  public reactToMaster = true;
  @nonEnumerable()
  private __parentFixture: any;

  private __value: ChannelValueType = 0;

  constructor(public name: string, __value: ChannelValueType  , public circ: number= 0, public _enabled: boolean= true) {
    if (!__value) {__value = 0; } // ensure numeric
    this.setValueChecking(__value);
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


  public configureFromObj(ob: any) {

    if (ob.name !== undefined) {this.name = ob.name; }
    if (ob.value !== undefined) {this.setValue( ob.value, false); }
    if (ob.circ !== undefined) {this.setCirc( ob.circ); }
    if (ob.reactToMaster !== undefined) {this.reactToMaster = ob.reactToMaster; }
  }



  get trueCirc() {
    let baseCirc = 0;
    if (this.__parentFixture && !isNaN(this.__parentFixture.baseCirc)) {
      baseCirc = this.__parentFixture.baseCirc;
    }
    else{
      console.error(this.__parentFixture?"NaN parent baseCirc": "no parent")
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



  @RemoteFunction()
  public setValue(v: number, doNotify: boolean) {
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

  public isSameAs(c:ChannelBase){
    return c===this || ( (this.name===c.name) && (this.__parentFixture.name===c.__parentFixture.name))
  }
  @RemoteFunction()
  public setCirc(n: number) {
    UniverseListener.notify(this.trueCirc, 0);
    this.circ = n;
    UniverseListener.notify(this.trueCirc, this.__value);
    if(this.__parentFixture && this.__parentFixture.universe ){this.__parentFixture.universe.checkDuplicatedCirc();}
  }

  public get colorChannelCode(){
      if(this.name==="r" || this.name==="red" ){return "r"}
      else if(this.name==="g" || this.name==="green"){return "g"}
      else if(this.name==="b" || this.name==="blue"){return "b"}
      else return null
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
    if(f && this.__parentFixture){
      if(f.name!==this.__parentFixture.name){
        debugger
      }
    }
    this.__parentFixture = f;
    this.checkNameDuplicate();
    if(this.__parentFixture && this.__parentFixture.universe){this.__parentFixture.universe.checkDuplicatedCirc();}
  }

  

  private setValueChecking(__value: number) {
    if (typeof __value !== 'number') {
      console.error('wrong valval');
      debugger;
      // this.__value = 0;
    } else {
      this.__value = __value;
    }
  }
  public getState(){
    return {trueCirc:this.trueCirc,value:this.floatValue,name:this.name}
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





