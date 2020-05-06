import { getNextUniqueName } from './Utils';
import { FixtureBase, FixtureGroup , FixtureBaseI} from './Fixture';
import { RemoteFunction, RemoteValue, nonEnumerable, AccessibleClass } from './ServerSync';
import dbg from './dbg'
const dbgStruct = dbg('STRUCT')
type ChannelValueType = number; // |number[];

import {EventEmitter} from 'events'; // for universe listener class


export const ChannelRoles: {[id: string]: {[id: string]: {names: Array<string|RegExp>}}} = {
  color: {
    r: {names: ['red', 'r', /red.*master/]},
    r_fine: {names: [/red.*fine/, /r.*fine/]},
    g: {names: ['green', 'g', /green.*master/]},
    g_fine: {names: [/green.*fine/, /g.*fine/]},
    b: {names: ['blue', 'b', /blue.*master/]},
    b_fine: {names: [/blue.*fine/, /b.*fine/]},
    w: {names: ['white', 'w']},
    w_fine: {names: [/white.*fine/, /w.*fine/]},
    a: {names: ['amber', 'a']},
    a_fine: {names: [/amber.*fine/, /amber.*fine/]},
  },
  position: {
    pan: {names: ['pan', /pan.*coarse/]},
    pan_fine: {names: [/pan.*fine/]},
    tilt: {names: ['tilt', /tilt.*coarse/]},
    tilt_fine: {names: [/tilt.*fine/]},

  },
  fog: {
    vent: {names: [/vent.*/]},
    heat: {names: [/heat.*/]},
  },
  dim: {
    dimmer: {names: [/channel.*/, /dim.*/, 'master']},
  },
  other: {
    other: {names: []},
  },

};

export interface ChannelI {

  name: string;
  // private __value: ChannelValueType;

  circ: number;
  roleType: string;
  roleFam: string;

  setValue(v: ChannelValueType, doNotify: boolean): boolean;
  setValueInternal(v: ChannelValueType): boolean;

}



type ChannelConstructorI  = new (...args: any[]) => ChannelBase;




@AccessibleClass()
export class ChannelBase implements ChannelI {


  get trueCirc() {
    let baseCirc = 0;
    if (this.__parentFixture && !isNaN(this.__parentFixture.baseCirc)) {
      baseCirc = this.__parentFixture.baseCirc;
    } else {
      console.error(this.__parentFixture ? 'NaN parent baseCirc' : 'no parent');
    }
    return baseCirc + this._circ;
  }
  get circ() {return this._circ; }

  get intValue() {return this.__value * 255; }

  get floatValue() {return this.__value; }

  get trueValue() {
    return this.__value;
  }
  public get reactToMaster() {return this.roleFam === 'dim'; }
  public get parentFixture() {return this.__parentFixture; }

  public static createFromObj(ob: any, parent: FixtureBase): ChannelBase|undefined {

    const c =  new  ChannelBase(ob.name, ob.value, ob.circ);
    c.setParentFixture(parent);
    c.configureFromObj(ob);
    return c;

  }





  public hasDuplicatedCirc = false;
  public roleType = '';
  public roleFam = '';

  @nonEnumerable()
  public externalController: any = null;

  @nonEnumerable()
  private __parentFixture: FixtureBase|null = null;

  private __value: ChannelValueType = 0;

  private __isDisposed = false;

  @RemoteValue()
  public name: string
  constructor( _name: string, __value: ChannelValueType  , private _circ: number= 0) {
    this.name = _name
    if (!__value) {__value = 0; } // ensure numeric
    this.updateRoleForName();
    this.setValueChecking(__value);
  }


  public getUID() {
    return (this.__parentFixture ? this.__parentFixture.name : 'noparent') + ':' + this.name;
  }

  public __dispose() {
    if (!this.__isDisposed) {dbgStruct('disposing channel ', this.getUID()); }
    this.__isDisposed = true;
  }

  public matchFilter(n: string|RegExp) {
    return (n === 'all') || (this.roleFam === n) || (this.roleFam + ':' + this.roleType === n);
  }
  public matchFilterList(l: string[]) {
    if (!l || l.length === 0) {return true; }
    return l.some((e) => this.matchFilter(e));

  }

  public updateRoleForName() {
    let foundType = '';
    let foundFam = '';
    const minName = this.name.toLowerCase();
    for (const fam of Object.keys(ChannelRoles)) {
      const cFam = ChannelRoles[fam];
      if (fam === 'other') {continue; }
      for (const type of Object.keys(cFam)) {
        const names = cFam[type].names;
        if (names.find((e: string|RegExp) => {
          if (typeof e === 'string') {return e === minName; }
          return minName.match(e);
        })) {
          foundType = type;
          foundFam = fam;
          break;
        }
      }
      if (foundFam !== '') {break; }
    }
    this.roleType = foundType || 'other';
    this.roleFam = foundFam || 'other';
  }




  public configureFromObj(ob: any) {

    if (ob.name !== undefined) {this.name = ob.name; }
    if (ob.value !== undefined) {this.setValue( ob.value, false); }
    if (ob._circ !== undefined) {this.setCirc( ob._circ); }
    this.updateRoleForName();
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

  public isSameAs(c: ChannelBase) {
    if(c===this){
      return true;
    }
    const sameName = (this.name === c.name)
    if (this.__parentFixture && c.__parentFixture ){
      return sameName && (this.__parentFixture.name === c.__parentFixture.name)
    }
    debugger;
    return sameName
  }
  @RemoteFunction()
  public setCirc(n: number) {
    UniverseListener.notify(this.trueCirc, 0);
    this._circ = n;
    UniverseListener.notify(this.trueCirc, this.__value);
    if (this.__parentFixture && this.__parentFixture.universe ) {this.__parentFixture.universe.checkDuplicatedCircDebounced(); }
  }

  public setName( n: string ) {
    this.name = n;
    this.checkNameDuplicate();
    this.updateRoleForName();
  }

  public checkNameDuplicate() {
    if (this.__parentFixture) {
      this.name = getNextUniqueName(this.__parentFixture.channels.filter( (c: ChannelBase) => c !== this).map((c: ChannelBase) => c.name), this.name);
    }
  }

  public setValueInternal(v: ChannelValueType) {return true; }

  public setParentFixture(f: FixtureBase|null) {
    if (f && this.__parentFixture) {
      if (f.name !== this.__parentFixture.name) {
       // debugger;
     }
   }
    this.__parentFixture = f;
    this.checkNameDuplicate();
    if (this.__parentFixture && this.__parentFixture.universe) {this.__parentFixture.universe.checkDuplicatedCircDebounced(); }
 }
 public getState() {
  return {trueCirc: this.trueCirc, value: this.floatValue, name: this.name};
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


}


export class ChannelGroup extends ChannelBase {

  // updateChannelsInternal(){
  //   this.channels = this.parentFixtures.map(f=>{return f.getChannelForName(name)})
  // }
  static isChannelGroup(c: ChannelBase): c is ChannelGroup{
    return (c as ChannelGroup).isGroup
  }
  get channels(): ChannelBase[] {
    return this.parentFixtures.map((f) => f.getChannelForName(this.name)).filter((c) => c !== undefined) as ChannelBase[];
  }
  get universe() {
    return this.parentFixtures.length ? this.parentFixtures[0].universe : null;
  }

  get parentFixtures() {
    return this.__parentGroup.fixtures ;
  }
  //   if(this.universe){
  //     return this.parentFixtureNames.map(n=>this.universe.getFixtureWithName(n)).filter(f=>f!==undefined)
  //   }
  //   return new Array<FixtureBase>()
  // }

  public static createFromObj(ob: any, parent: FixtureBase): ChannelBase|undefined {

    const c =  new  ChannelGroup(ob.name, ob.value);
    c.setParentFixture(parent);
    c.configureFromObj(ob);
    return c;

  }
  // private channels = new Array<ChannelBase>();
  // @nonEnumerable()
  // private __parentGroup : FixtureGroup|null= null
  @nonEnumerable()
  public isGroup=true

  
  constructor(public name: string , private __parentGroup: FixtureGroup) {
    super(name, 0);
    Reflect.defineProperty(this, '__parentGroup', {
      value: this.__parentGroup,
      enumerable: false,
      writable: false,
    });


  }

  public setCirc(n: number) {
     debugger; console.error('no circ fro channel group');
  }

  @RemoteFunction({sharedFunction: true})
  public setValue(v: number, doNotify: boolean) {
    this.channels.map((c) => c.setValue(v, doNotify))
    return super.setValue(v,false)// don't notify as we only want to update saved value but not ChannelGroup DMX
  }
}



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





