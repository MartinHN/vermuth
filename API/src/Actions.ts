import { ChannelBase, ChannelGroup } from './Channel';
import { FixtureBase, FixtureGroup } from './Fixture';
import { Universe } from './Universe';
import { sequencePlayer, Sequence } from './Sequence';
import { nonEnumerable, RemoteFunction, AccessibleClass, RemoteArray, AutoAccessible, setChildAccessible, RemoteValue, ClientOnly, doSharedFunction, buildAddressFromObj, resolveAccessible, Ref, SetAccessible, AccessibleMap, RemoteMap } from './ServerSync';
import { addProp, deleteProp, Proxyfiable, nextTick } from './MemoryUtils';

import { CurvePlayer, CurveLink, CurveLinkStore } from './CurvePlayer';
import rootState from './RootState';


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
  ChannelBase,
  State,
  Sequence
}

export interface ActionType {
  readonly atype: string;
  inputCaps: { [id: string]: InputCapType };
  targetCaps: TargetCapType;
  new(ob: any): ActionInstance;

}

export abstract class ActionInstance extends Proxyfiable {
  getATYPE(): ActionType { return "non" as unknown as ActionType }
  abstract filterTarget(l: any[]): any[];
  abstract targets: RemoteArray<Ref<any>>;
  abstract inputs: any;
  abstract apply(): void;
  abstract configureFromObj(ob: any): void;
  internalState: any =  {}
  hasInternalState(){return Object.keys(this.internalState).length>0}


  // filterTarget<T>(potential: T[]): T[]{
  //   return potential;
  // }
  // abstract apply(input: any,target: any): void;
}



@AccessibleClass()
export class TypedActionInstance<I, O extends { name: string }> extends ActionInstance {
  filterTarget(potential: O[]): O[] {
    return potential.slice();
  }
  constructor(ob: any) {
    super()
    // debugger
    // this.pinputs.setFromObj(this.defaultInputs)
  }
  get defaultInputs(): I { return {} as I }

  apply() { }


  @SetAccessible()
  targets = new RemoteArray<Ref<O>>((s: string) => {
    return new Ref<O>(s)
  })

  @RemoteFunction()
  setInputs(v: I) {
    // debugger
    this.pinputs = v//.setFromObj(v)
    this.apply()
  }

  @RemoteFunction()
  setInputNamed(n: string, v: any) {
    (this.pinputs as any)[n] = v;
  }
  get inputs() { return this.pinputs as unknown as I }
  set inputs(v: I) { 
    // debugger
    this.pinputs = v;
  }//.setFromObj(v) }
  get inputValues() { return Object.assign({}, this.inputs) } // removes object address nefast when called on remotes


  @SetAccessible({autoAddRemoteValue:true,noRef:true})
  private pinputs: I = this.defaultInputs as I;
  // get pinputs(){return this.ppinput}
  // set pinputs(v:I){debugger;this.ppinput=v}



  filterRule = ""

  toJSON() {
    return {
      atype: this.getATYPE().atype,
      targets: this.targets.toJSON(),
      inputs: this.pinputs
    }
  }

  configureFromObj(ob: any) {
  
    if (ob?.targets) {
      this.targets.configureFromObj(ob.targets)

    }
    let inp = this.defaultInputs
    if (ob?.inputs) { inp = Object.assign(inp, ob.inputs) }
    this.pinputs = inp//.setFromObj(inp)
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
    p.prototype.getATYPE = () => { return p }
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







export class ActionList extends RemoteArray<ActionInstance> {
  constructor() {
    super(ActionFactory.generateActionFromObj.bind(ActionFactory))
    // debugger;
    // setChildAccessible(this,"plist")
  }

  // public get list(){return this.l}
  // list = new RemoteArray<ActionInstance>(ActionFactory.generateActionFromObj)
  forbiddenNames: string[] = []


  configureFromObj(ob: any) {
    super.configureFromObj(ob?.list)
    this.forbiddenNames = ob.forbiddenNames || []
  }

  @RemoteFunction({ sharedFunction: true })
  addFromName(e: string) {
    const a = ActionFactory.generateFromName(e);
    if (a) {
      this.push(a)
    }
    return a;

  }

  toJSON() {
    return { list: super.toJSON(), forbiddenNames: this.forbiddenNames }
  }

  getChannelValues() {
    const origin = ChannelBase.prototype.setValue
    const chV: any = {}
    ChannelBase.prototype.setValue = function (v: number, doNotify: boolean) {
      chV[this.getUID()] = v
      return true;
    }
    this.map((e) => {
      e.apply()
    })
    console.log("actions :: ", chV)
    ChannelBase.prototype.setValue = origin
    return chV
  }



}





///////////////::
// Implementations
//////////////:

type DimmerIn = { dimmer: number }
class SetDimmerAction extends TypedActionInstance<DimmerIn, FixtureBase>{
  static atype = 'setDimmer';
  static inputCaps = { dimmer: InputCapType.Number }
  static targetCaps = TargetCapType.FixtureBase
  getATYPE() { return SetDimmerAction; }
  constructor(ob?: any) {
    super(ob)
  }
  get defaultInputs() { return { dimmer: 1 } }
  apply() {
    for (const f of this.targets) {
      f.get()?.setMaster(this.inputs.dimmer);
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
    super(ob)
    // debugger
  }
  get defaultInputs() { return { color: { r: 0, g: 0, b: 0 }, setWhiteToZero: false } }

  apply() {
    const v = this.inputValues // avoid sending ref
    debugger
    for (const f of this.targets) {
      f.get()?.setColor(v.color, v.setWhiteToZero)
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
    super(ob)

  }
  get defaultInputs() { return { x: 0, y: 0 } }
  apply() {
    const v = this.inputValues
    for (const f of this.targets) {
      f.get()?.setPosition(v)
    }
  }
  filterTarget(fl: FixtureBase[]) { return fl.filter(f => f.hasPositionChannels) }
}


ActionFactory.register(SetPosAction)



import { State, FixtureState } from './State'

type SetFixtureIn = { dimmer: number}
type SetFixtureTarget = ChannelBase
class SetFixtureAction extends TypedActionInstance<SetFixtureIn, SetFixtureTarget>{
  static atype = 'setFixture';
  public static inputCaps = { dimmer: InputCapType.Number};
  static targetCaps = TargetCapType.ChannelBase
  static SCount = 0
  getATYPE() { return SetFixtureAction; }

  constructor(ob: any) {
    super(ob)

  }
  get defaultInputs() { return { dimmer: 1 } }
  apply() {
    debugger
    for ( const [fName,v] of Object.entries(this.internalState)){
      const fixture=rootState.universe.fixtureAndGroupList.find(f=>f.name===fName)
      if(fixture){
      for ( const [chName,vv] of Object.entries(v)){
        if(vv.preseted){
          const ch = fixture.getChannelForName(chName)
          if(ch){
            ch.setValue(vv.value,true)
          }
        }
      }
    }
    }
    rootState.universe.fixtureAndGroupList
    // rootState.stateList.recallState(this.internalState,this.inputs.dimmer,false)
    // const v = this.internalState?.apply()
    
  }
  filterTarget(fl: ChannelBase[]) { return fl }
  @SetAccessible({autoAddRemoteValue:true,noRef:true})
  internalState: {[id: string]: {[id: string]: {preseted: boolean; value: number}}} = {};//Array<FixtureState>()
  hasInternalState(){return true;}
}


ActionFactory.register(SetFixtureAction)




type PresetIn = { dimMaster: number }
type PresetTarget = State
class SetPresetAction extends TypedActionInstance<PresetIn, PresetTarget>{
  static atype = 'dimPreset';
  public static inputCaps = { dimMaster: InputCapType.Number };
  static targetCaps = TargetCapType.State

  getATYPE() { return SetPresetAction; }

  constructor(ob: any) {
    super(ob)

  }

  get defaultInputs() { return { dimMaster: 1 } }

  apply() {
    for (const s of this.targets.map(t => t.get()).filter(u => u !== undefined) as Array<PresetTarget>) {
      rootState.stateList.recallState(s, this.inputs.dimMaster, false)
    }
  }
  // filterTarget(sl: State[]) { return sl.filter(f => f.hasPositionChannels) }
}


ActionFactory.register(SetPresetAction)





// function test(){
//   const a = new SetDimmerAction()
//   a.targets.push(new Ref("/?/universe/f"))

//   const o = buildEscapedObject(a)
//     debugger

// }
// test()