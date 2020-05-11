import { ChannelBase, ChannelGroup } from './Channel';
import { FixtureBase, FixtureGroup } from './Fixture';
import { Universe } from './Universe';
import { sequencePlayer, Sequence } from './Sequence';
import { nonEnumerable, RemoteFunction, AccessibleClass, setChildAccessible, RemoteValue, ClientOnly, doSharedFunction, buildAddressFromObj, resolveAccessible } from './ServerSync';
import { addProp, deleteProp, Proxyfiable } from './MemoryUtils';

import { CurvePlayer, CurveLink, CurveLinkStore } from './CurvePlayer';
import  rootState  from './RootState';


type Constructable<I> = new (...args: any[]) => I;
abstract class PConstructableC {
  protected constructor(...args: any[]) { }
}

// return function <I, T extends Constructable<I>>

class Color {
  r!: number;
  g!: number;
  b!: number;
}


export enum InputCapType {
  Number,
  Color,
  Boolean
}

export enum TargetCapType {
  FixtureBase,
  State,
  Sequence
}

export interface ActionType {
  readonly atype: string;
  inputCaps: { [id: string]: InputCapType };
  targetCaps: TargetCapType;
  new(ob: any): ActionInstance;

}

export abstract class ActionInstance {
  getATYPE(): ActionType{return "non" as unknown as ActionType}
  abstract filterTarget(l: any[]): any[];
  abstract targets: any[];
  abstract inputs: any;
  abstract apply(): void;
  abstract configureFromObj(ob: any): void;
  // filterTarget<T>(potential: T[]): T[]{
  //   return potential;
  // }
  // abstract apply(input: any,target: any): void;
}

// const rootState = import('./RootState')
console.log('rsssssss', rootState)
export abstract class TypedActionInstance<I, O extends { name: string }> extends ActionInstance {
  filterTarget(potential: O[]): O[] {
    return potential.slice();
  }

  targets = new Array<O>();

  set inputs(v: I) {
    this.pinput = v
    this.apply()
  }
  get inputs() { return this.pinput }
  pinput!: I;
  filterRule = ""

  toJSON() {
    return {
      atype: this.getATYPE().atype,
      targets: this.targets.map(f => buildAddressFromObj(f)),
      inputs: this.pinput
    }
  }

  configureFromObj(ob: any) {
    if (ob.targets) {
      this.targets = []
      Object.values(ob.targets as Array<string>).map((v) => {
        this.targets.push(resolveAccessible(rootState, v.split('/')).accessible)
      })
    }
    if (ob.inputs) {
      this.inputs = ob.inputs
    }
  }
}

// type ActionGen = new (ob: any) => ActionInstance


class ActionFactoryClass {

  public readonly actions: { [id: string]: ActionType } = {};
  register(p: ActionType) {
    if (this.actionNames.includes(p.atype)) {
      console.error("reregister action ", p.atype)
      throw Error('cant register two actions of same type')
    }
    console.log('registering ', p.atype, p.inputCaps, p.targetCaps)
    this.actions[p.atype] = p
    p.prototype.getATYPE = ()=>{return p}
  }

  get actionNames() {
    return Object.keys(this.actions)
  }
  generateFromName(n: string) {
    return this.generateActionFromObj({ atype: n })
  }

  generateActionFromObj(ob: any) {
    if (ob?.atype && Object.keys(this.actions).includes(ob.atype)) {
      return new this.actions[ob.atype](ob)
    }
    else {
      console.error("can't find Action in ob ", ob?.atype, ob)
      return undefined
    }

  }

  getDefault() {
    return this.generateActionFromObj({ atype: this.actionNames[0] })
  }
}
export const ActionFactory = new ActionFactoryClass()









///////////////::
// Implementations
//////////////:

type DimmerIn = { dimmer: number }
class SetDimmerAction extends TypedActionInstance<DimmerIn, FixtureBase>{
  static atype = 'setDimmer';
  static inputCaps = { dimmer: InputCapType.Number }
  static targetCaps = TargetCapType.FixtureBase
  getATYPE() { return SetDimmerAction; }
  constructor(ob: any) {
    super()
    this.inputs = ob?.inputs || { dimmer: 1 }
  }
  apply() {
    for (const f of this.targets) {
      f.setMaster(this.inputs.dimmer);
    }

  }
  filterTarget(fl: FixtureBase[]) { return fl.filter(f => f.hasDimmerChannels) }

}
ActionFactory.register(SetDimmerAction)

type ColorIn = { color: Color; setWhiteToZero: boolean }
type ColorTarget = FixtureBase
class SetColorAction extends TypedActionInstance<ColorIn, ColorTarget>{
  static atype = 'setColor';
  public static inputCaps = { color: InputCapType.Color, setWhiteToZero: InputCapType.Boolean };
  static targetCaps = TargetCapType.FixtureBase

  getATYPE() { return SetColorAction; }

  constructor(ob: any) {
    super()
    this.inputs = ob.inputs || { color: { r: 0, g: 0, b: 0 }, setWhiteToZero: false }
  }

  apply() {
    for (const f of this.targets) {
      f.setColor(this.inputs.color, this.inputs.setWhiteToZero)
    }
  }
  filterTarget(fl: FixtureBase[]) { return fl.filter(f => f.hasColorChannels) }
}


ActionFactory.register(SetColorAction)

type PosIn = { x: number; y: number }
type PosTarget = FixtureBase
class SetPosAction extends TypedActionInstance<PosIn, PosTarget>{
  static atype = 'setPos';
  public static inputCaps = { x: InputCapType.Number, y: InputCapType.Number };
  static targetCaps = TargetCapType.FixtureBase

  getATYPE() { return SetPosAction; }

  constructor(ob: any) {
    super()
    this.inputs = ob.inputs || { x: 0, y: 0 }
  }

  apply() {
    for (const f of this.targets) {
      f.setPosition({ x: this.inputs.x, y: this.inputs.y })
    }
  }
  filterTarget(fl: FixtureBase[]) { return fl.filter(f => f.hasPositionChannels) }
}


ActionFactory.register(SetPosAction)


// type OtherIn = { dimmer: number;}
// type OtherTarget = ChannelBase
// class SetOtherAction extends TypedActionInstance<OtherIn, OtherTarget>{
//   static atype = 'setPos';
//   public static inputCaps = { dimmer: InputCapType.Number};
//   static targetCaps = TargetCapType.ChannelBase

//   getATYPE() { return SetOtherAction; }

//   constructor(ob: any) {
//     super()
//     this.inputs = ob.inputs || { x: 0, y: 0 }
//   }

//   apply() {
//     for (const f of this.targets) {
//       f.setPosition({ x: this.inputs.x, y: this.inputs.y })
//     }
//   }
//   filterTarget(fl: FixtureBase[]) { return fl.filter(f => f.hasPositionChannels) }
// }


// ActionFactory.register(SetPosAction)





import {State} from './State'
type PresetIn = { dimMaster: number }
type PresetTarget = State
class SetPresetAction extends TypedActionInstance<PresetIn, PresetTarget>{
  static atype = 'dimPreset';
  public static inputCaps = { dimMaster: InputCapType.Number };
  static targetCaps = TargetCapType.State

  getATYPE() { return SetPresetAction; }

  constructor(ob: any) {
    super()
    this.inputs = ob.inputs || { dimMaster: 1 }
  }

  apply() {
    for (const s of this.targets) {
      rootState.stateList.recallState(s, this.inputs.dimMaster,false )
  }
}
// filterTarget(sl: State[]) { return sl.filter(f => f.hasPositionChannels) }
}


ActionFactory.register(SetPresetAction)


@AccessibleClass()
export class ActionList{

  
  public readonly list: ActionInstance[] = []

  forbiddenNames: string[]=[]

  @RemoteFunction({sharedFunction:true})
  addActionFromObj(ob:any){
    const a = ActionFactory.generateActionFromObj(ob)
    if(a){
      this.list.push(a)
    }
    return a;
    
  }

  @RemoteFunction({sharedFunction:true})
  removeAction(a:ActionInstance){
    const i= this.list.indexOf(a)
    if(i>=0){
      this.list.splice(i,1)
    }
    return i>=0;
    
  }

  configureFromObj(ob:any){
    while(this.list.length){
      this.removeAction(this.list[0])
    }
    this.forbiddenNames = []
    ob.list?.map((l:any)=>this.addActionFromObj(l))
    this.forbiddenNames = ob.forbiddenNames || []
    

  }

  @RemoteFunction({sharedFunction:true})
  addFromName(e:string){
    const a = ActionFactory.generateFromName(e);
    if(a){
      this.list.push(a)
    }
    return a;

  }




}