import { ChannelBase, ChannelGroup } from './Channel';
import { FixtureBase, FixtureGroup } from './Fixture';
import { Universe } from './Universe';
import { sequencePlayer } from './Sequence';
import { nonEnumerable, RemoteFunction, AccessibleClass, setChildAccessible, RemoteValue, RemoteArray, ClientOnly, doSharedFunction, SetAccessible, findLocationInParent, isProxySymbol, AccessibleMap, RemoteMap } from './ServerSync';
import { addProp, deleteProp, Proxyfiable } from './MemoryUtils';

import { CurvePlayer, CurveLink, CurveLinkStore } from './CurvePlayer';
import { ActionList } from './Actions';
import { isPlainObject } from 'lodash';
import { resolve } from 'dns';


interface ChannelsValuesDicTypes { [id: string]: number }
// type ChannelsValuesDicTypes = RemoteMap<number>
interface ChannelsCurveLinkDicTypes { [id: string]: { uid: string } }

const isValidChannelName = (k: string | symbol | number) => {
  return (
    !(typeof k === "symbol") &&
    !k.toString().startsWith("_") &&
    !(["state", "toJSON", "constructor", "render"].includes(k.toString()))
  );
};

type SavedValueType = number | CurveLink;

type FixtureStateObject = { [channelName: string]: { preseted: boolean; value: number } }
type FixtureStateObjectOnlyValues = { [channelName: string]: number }

type FullStateObject = { [fixtureName: string]: FixtureStateObject }
type FullStateObjectOnlyValues = { [fixtureName: string]: FixtureStateObjectOnlyValues }

export class FixtureState {

  // @nonEnumerable()

  private pState = new Proxy({},
    {

      get: (o: any, k: string) => {
        const self = this;
        if (!(self.pChannelValues as any)[isProxySymbol]) {
          // debugger
        }

        if (isValidChannelName(k) && !(Object.keys(o).includes(k))) {

          // debugger
          let cachedValue = self.pChannelValues?.[k] || 0
          addProp(o, k, {
            get preseted() {
              return Object.keys(self.pChannelValues).includes(k)
            },
            set preseted(v: boolean) {
              if (v) {
                self.pChannelValues[k] = cachedValue;
                // addProp(self.pChannelValues, k, cachedValue)
                // cachedValue = self.pChannelValues[k]
              }
              else {
                deleteProp(self.pChannelValues, k)
              }
            },
            get value() {
              return self.pChannelValues?.[k] || cachedValue;
            },
            set value(v: number) {
              if (this.preseted) self.pChannelValues[k] = v
              cachedValue = v
            }
          })
        }
        // const fakeTouch =self.pChannelValues;
        return Reflect.get(o, k)
      },

      set: (o: any, k: string | number | symbol, v: any, thisProxy: any) => {
        const self = this
        if (isValidChannelName(k)) {
          // debugger;
          // const fakeTouch =self.pChannelValues;
          if (v.preseted) {
            self.pChannelValues[k.toString()] = v.value
          }
          else if (v.preseted !== undefined) {
            if (Object.keys(self.pChannelValues).includes(k.toString())) {
              self.pChannelValues[k.toString()] = -1
              // deleteProp(self.pChannelValues, k.toString())
              delete self.pChannelValues[k.toString()]
            }
          }
          else {
            console.error("presetable not handled", k, v)
            debugger
          }

        }

        return Reflect.set(o, k, v, thisProxy)
      }
      , deleteProperty: (o, k) => {
        const self = this
        delete self.pChannelValues[k.toString()]
        return Reflect.deleteProperty(o, k);
      }

    });

  get presetableState(): FixtureStateObject {
    return this.pState;
  }

  set presetableState(v: FixtureStateObject) {
    // debugger
    this.pChannelValues = {}
    for (const [k, s] of Object.entries(v)) {
      if (s.preseted) {
        this.pChannelValues[k] = s.value
      }

    }
  }


  get channelValues(): ChannelsValuesDicTypes {
    return Object.assign({}, this.pChannelValues);
  }
  get channelCurveLinks(): ChannelsCurveLinkDicTypes {
    return Object.assign({}, this.pChannelCurveLinks);
  }

  public static createFromObj(o: any) {
    const res = new FixtureState();
    res.configureFromObj(o);
    return res;
  }
  public name = '';
  // @SetAccessible({autoAddRemoteValue:true})
  // @AccessibleMap()
  private pChannelValues: ChannelsValuesDicTypes = {};//= new RemoteMap<number>(-1);
  private pChannelCurveLinks: ChannelsCurveLinkDicTypes = {};
  constructor(fixtureOrName?: FixtureBase | string, options?: { overrideValue?: number; channelFilter?: (c: ChannelBase) => boolean; full?: boolean; channelNames?: string[] }) {
    if (fixtureOrName === undefined) { return; }
    const hasName = typeof (fixtureOrName) === "string"
    this.name = hasName ? (fixtureOrName as string) : (fixtureOrName as FixtureBase).getUID();
    let validChs: ChannelBase[];
    const channels = hasName ? [] : (fixtureOrName as FixtureBase).channels;
    if (options && options.full) {
      validChs = channels;
    } else if (options && options.channelFilter) {
      validChs = channels.filter(options.channelFilter);
    } else if (options && options.channelNames && options.channelNames.length) {
      const vNames = options.channelNames || [];
      validChs = channels.filter((c) => vNames.includes(c.getUID()));
    } else {
      validChs = [];
      // debugger;
      console.error('old way of creating state');
    }
    validChs.map((c) => {
      const curveLink = CurvePlayer.getCurveLinkForChannel(c);

      addProp(curveLink ? this.pChannelCurveLinks : this.pChannelValues,
        c.name,
        (options && options.overrideValue !== undefined) ?
          options.overrideValue :
          (curveLink && { uid: curveLink.uid }) ||
          c.floatValue,
      );
    });
  }

  public configureFromObj(o: any) {
    this.name = o.name;
    this.pChannelValues = o.pChannelValues;

    this.pChannelCurveLinks = o.pChannelCurveLinks;
  }
  public isEmpty() {
    return (Object.keys(this.pChannelCurveLinks).length == 0) && Object.keys(this.pChannelValues).length == 0;
  }

  public setAllValues(v: number) {
    Object.keys(this.pChannelValues).forEach((k) => { this.pChannelValues[k] = v; });
  }
}

export class ResolvedFixtureState {
  public channels: { [id: string]: { channel: ChannelBase; value: SavedValueType } } = {};

  constructor(public state: FixtureState, public fixture: FixtureBase, public dimMaster = 1) {
    Object.entries(this.state.channelValues).forEach(([k, cv]) => {
      const c = this.fixture.getChannelForName(k);
      if (c) {
        const tV = c.reactToMaster ? cv * dimMaster : cv;
        this.channels[c.name] = { channel: c, value: tV };
      }
    });
    Object.entries(this.state.channelCurveLinks).forEach(([k, cv]) => {
      const c = this.fixture.getChannelForName(k);
      const curveLink = CurveLinkStore.getForUID(cv.uid);
      if (c && curveLink) {
        this.channels[c.name] = { channel: c, value: curveLink };
      }
    });
  }

  public getStateForChannel(c: ChannelBase) {
    for (const o of Object.values(this.channels)) {
      if (o.channel === c) {
        return o;
      }
    }
  }
  get channelList() {
    return Object.values(this.channels).map((e) => e.channel);
  }

  public mergeWith(r: ResolvedFixtureState) {
    for (const [k, ob] of Object.entries(r.channels)) {
      const thisO = this.getStateForChannel(ob.channel);
      if (thisO) {
        thisO.value = ob.value;
      } else {
        this.channels[k] = Object.assign({}, ob);
      }
    }
  }
  public applyState() {
    debugger
    Object.values(this.channels).map((cv) => {
      CurvePlayer.removeChannel(cv.channel);

      if (typeof (cv.value) === 'number') {
        if (cv.channel.parentFixture?.name === "Lazer" && cv.channel.name === "dim") {
          debugger
        }
        cv.channel.setValue(cv.value, true);
      } else {
        const curveLink = cv.value as CurveLink;
        CurvePlayer.addCurveLink(curveLink);
      }
    });
  }
  public applyFunction(cb: (channel: ChannelBase, value: SavedValueType) => void) {
    Object.values(this.channels).map((cv) => { cb(cv.channel, cv.value); });
  }
}


class MergedChannel {
  constructor(public channel: ChannelBase, public sourcev: SavedValueType, public targetv: SavedValueType) {
    const sourceCurveLink = this.sourceCurveLink();
    if (sourceCurveLink) {
      sourceCurveLink.autoSetChannelValue = false;
      this.sourceGetter = () => {
        return sourceCurveLink.value;

      };

    }
    const targetCurveLink = this.targetCurveLink();
    if (targetCurveLink) {
      targetCurveLink.autoSetChannelValue = false;
      this.targetGetter = () => {
        return targetCurveLink.value;
      };
      CurvePlayer.addCurveLink(targetCurveLink);
    }



  }
  public sourceCurveLink() {
    return typeof (this.sourcev) !== 'number' ? this.sourcev as CurveLink : undefined;
  }
  public targetCurveLink() {
    return typeof (this.targetv) !== 'number' ? this.targetv as CurveLink : undefined;
  }
  public sourceGetter(): number { // overriden for complex types as curves
    return this.sourcev as number;
  }
  public targetGetter(): number {
    return this.targetv as number;
  }
  public applyCrossfade(pct: number) {
    const sourcev = this.sourceGetter();
    const targetv = this.targetGetter();
    if (sourcev !== targetv) {
      const diff = targetv - sourcev;
      const v = sourcev + pct * diff;
      this.channel.setValue(v, true);
    }
  }
  public endCB() {
    const sourceCurveLink = this.sourceCurveLink();
    if (sourceCurveLink) {
      CurvePlayer.removeCurveLink(sourceCurveLink);
      sourceCurveLink.autoSetChannelValue = true;
    }
    const targetCurveLink = this.targetCurveLink();
    if (targetCurveLink) {
      targetCurveLink.autoSetChannelValue = true;
    }

  }
}
export class MergedState {
  public channels = new Array<MergedChannel>();
  constructor(public target: ResolvedFixtureState[]) {
    for (const rfs of target) {
      for (const i of Object.keys(rfs.channels)) {
        const channelObj = rfs.channels[i];
        const channel = channelObj.channel;
        const sourcev = CurvePlayer.getCurveLinkForChannel(channel) || channel.floatValue;
        const targetv = channelObj.value;
        this.channels.push(new MergedChannel(channel, sourcev, targetv));
      }
    }

  }

  public applyCrossfade(pct: number) {
    this.channels.map((c) => c.applyCrossfade(pct));
  }

  public endCB() {
    this.channels.map((c) => c.endCB());
  }
  public checkIntegrity() {
    const dupl = this.channels.filter((c, i) => {
      return i < this.channels.length - 1 && this.channels.slice(i + 1).find((cc) => c.channel === cc.channel) !== undefined;
    });
    if (dupl.length) {
      console.error(dupl);
    }
  }


}


class LinkedState extends Proxyfiable {
  constructor(private __owner: State, public name: string, _dimMaster: number) {
    super();
    this.dimMaster = _dimMaster;
    if (!name) {
      console.error('empty linked state name')
      debugger
    }
  }

  @RemoteValue((parent, value) => {
    if (parent.__owner) {
      doSharedFunction(() => {
        parent.__owner.linkedStateChanged(parent)
      })
    }
  })
  public dimMaster: number;
}


@AccessibleClass()
export class State {

  public static createFromObj(o: any, sl: StateList) {
    const res = new State(sl, o.name, [], []);
    res.configureFromObj(o);
    return res;
  }

  public fixtureStates: FixtureState[] = [];//= new  RemoteArray<FixtureState>();

  public linkedStates: LinkedState[] = [];

  public actions: ActionList = new ActionList();

  @nonEnumerable()
  private cachedPState = {}
  get presetableState() {

    const ss = this
    // const fake = this.fixtureStates.length ? this.fixtureStates[0] : null;
    const isValidStateName = (k: string | number | symbol) => {
      return (!k.toString().startsWith('_') &&
        typeof (k) == "string")
    }

    const res = new Proxy(this.cachedPState, {
      get(o, k, thisProxy) {
        // const o = ss.cachedPState
        if (!isValidStateName(k)) { return Reflect.get(o, k); }
        ss.checkDups();
        let f = ss.fixtureStates.find(e => e.name === k)
        if (!f) {
          ss.fixtureStates.push(new FixtureState(k.toString()))
          // ss.checkDups();
          f = ss.fixtureStates.find(e => e.name === k)
          if (!f) {
            console.error('wwww', k)
            debugger;
            return Reflect.get(o, k, thisProxy)
          }
        }


        return f.presetableState

      },
      set(o, k, v, thisProxy) {
        // const o = ss.cachedPState
        if (!isValidStateName(k)) { return Reflect.set(o, k, v, thisProxy); }
        // debugger
        // if(!Object.keys(o).includes(k))){addProp(o, k.toString(), v)}
        let f = ss.fixtureStates.find(e => e.name === k)
        // ss.checkDups();
        if (!f) {
          ss.fixtureStates.push(new FixtureState(k.toString()))
          // ss.checkDups();
          f = ss.fixtureStates.find(e => e.name === k)
          if (!f) {
            console.error('wwww', k)
            debugger;

          }
        }
        else {
          // debugger
          f.presetableState = v
        }
        return Reflect.set(o, k, v, thisProxy)
      },
      deleteProperty(o, k) {
        // const o = ss.cachedPState
        if (isValidStateName(k)) {
          let i = ss.fixtureStates.findIndex(e => e.name === k)
          while (i >= 0) {
            ss.fixtureStates.splice(i, 1)
            i = ss.fixtureStates.findIndex(e => e.name === k)
          }
        }
        return Reflect.deleteProperty(o, k)

      }
    })
    for (const fs of this.fixtureStates) {
      
      const ps: {[cname: string]: {preseted: boolean;value: number}} = {}
      if (!Object.keys(this.cachedPState).includes(fs.name)) {
        for (const [cn, cv] of Object.entries(fs.channelValues)) {
          ps[cn] = { preseted: true, value: cv }
        }
      }
      (res as any)[fs.name] = ps
    }
    return res;
  }
  set presetableState(v) {
    this.cachedPState = v;
  }

  constructor(private __stateList: StateList | undefined, public name: string, public __validChNames: string[], fixtures: FixtureBase[], public full?: boolean) {
    if (__validChNames.length === 0 && !name.startsWith('__') && !name.startsWith('current')) { debugger; }

    this.updateFromFixtures(fixtures);
    this.full = full ? true : false;

  }
  public toJSON() {

    const result: any = {};
    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== "cachedPState") {
        result[key] = this[key];
      }
    }
    result.fixtureStates = this.fixtureStates.filter(e => !e.isEmpty())
    return result;

  }
  checkDups() {
    const l = this.fixtureStates;
    const hasDups = l.length !== Array.from(new Set(l.map(e => e.name))).length;
    if (hasDups) {
      console.error("duplicate states ", l)
      const existing = new Array<string>()

      const newL = l.filter(e => {
        const res = !existing.includes(e.name);
        existing.push(e.name);
        return res;
      });
      this.fixtureStates = newL

    }
    // for(const f of Object.values(this.fixtureStates)){
    //  if(!Object.keys(this.presetableState).includes(f.name)){
    //    debugger
    //   this.presetableState[f.name]= f.presetableState
    //  }
    // }
    return hasDups
  }
  public configureFromObj(o: any) {
    if (!o) {
      debugger
    }
    this.name = o.name;
    this.fixtureStates = [];
    o?.fixtureStates.map((oo: any) => {
      const fs = FixtureState.createFromObj(oo);
      if (fs) {

        this.fixtureStates.push(fs);
      }
    });

    this.setLinkedStates(o.linkedStates);
    this.actions.configureFromObj(o.actions)
    this.full = o.full;
    this.checkDups()
  }
  public get hasLinked() {
    return this.linkedStates.length > 0;
  }
  @RemoteFunction({ sharedFunction: true })
  public addLinkedState(n: string, dimMaster: number) {
    if (dimMaster == 0) {
      return;
    }
    if (!this.linkedStates.find(ls => n == ls.name)) {
      this.linkedStates.push(new LinkedState(this, n, dimMaster));
      this.linkedStateChanged(this.linkedStates[this.linkedStates.length - 1])
    }
    else {
      console.error('duplicate linked state')
    }
  }

  @RemoteFunction({ sharedFunction: true })
  public removeLinkedStateNamed(name: string) {
    const i = this.linkedStates.findIndex(e => e.name === name)
    if (i >= 0) {
      this.linkedStates.splice(i, 1)
    }
  }
  setLinkedStates(v: { name: string; dimMaster?: number }[]) {
    if (!Array.isArray(v)) {
      console.error("trying to set bad linked states", v)
    }
    for (let i = this.linkedStates.length - 1; i >= 0; i--) {
      const e = this.linkedStates[i]
      if (!v.some(s => s.name === e.name)) {
        this.removeLinkedStateNamed(e.name)
      }
    }

    for (const e of v) {
      const dM = e.dimMaster === undefined ? 1 : e.dimMaster
      if (!e.name) {
        console.error('empty linked state name')
        debugger;
        continue;
      }
      const existing = this.linkedStates.find(ee => ee.name === e.name)
      if (existing) {
        existing.dimMaster = dM

        if (!existing || dM === 0) {
          this.removeLinkedStateNamed(existing.name)
        }
      }
      else if (dM > 0) {
        this.addLinkedState(e.name, dM)
      }

    }

  }


  public linkedStateChanged(ls: LinkedState) {
    if (this.__stateList) {
      if (this.__stateList.loadedStateName === this.name) {
        this.__stateList.recallState(this, 1, true)
      }
    }

  }
  public updateFromFixtures(fixtures: FixtureBase[]) {
    this.fixtureStates = [];

    const opts: { full: boolean; channelNames?: string[] } = { full: !!this.full };
    if (this.__validChNames) {
      opts.channelNames = this.__validChNames;
    }
    for (const f of fixtures) {
      const fs = new FixtureState(f, opts);
      if (!fs.isEmpty()) {
        this.fixtureStates.push(fs);
      }
    }
    this.checkDups()
  }



  public setAllValues(v: number) {
    for (const f of this.fixtureStates) {
      f.setAllValues(v);
    }
    return this;
  }

  public resolveState(context: FixtureBase[], sl: { [id: string]: State }, dimMaster: number, forbiddenStateNames?: string[]): ResolvedFixtureState[] {

    const res: ResolvedFixtureState[] = [];

    for (const f of this.fixtureStates) {
      if (f) {
        const fix = context.find((ff) => ff?.name === f.name);
        if (fix) {
          res.push(new ResolvedFixtureState(f, fix, dimMaster));
        }
        else {
          console.error("fixture not defined in context : ", f.name)
        }
      } else {
        console.error("fixture not defined in fixtureState")
      }
    }
    const otherRs: ResolvedFixtureState[] = [];
    if (!forbiddenStateNames) {
      forbiddenStateNames = []
    }
    forbiddenStateNames.push(this.name);
    this.linkedStates.map((s) => {
      if (forbiddenStateNames && forbiddenStateNames.includes(s.name)) { console.warn('prevent circular state ref'); return; }
      const os = sl[s.name];
      if (os) {
        // otherRs = otherRs.concat(os.resolveState(context, sl, s.dimMaster, forbiddenStateNames)); 
        StateList.mergeResolvedFixtureList(otherRs, os.resolveState(context, sl, s.dimMaster, forbiddenStateNames));
      } else { console.error('fuck states'); }
    });

    StateList.mergeResolvedFixtureList(otherRs, res); // this state should override linked

    return otherRs;
  }

  public getSavedFixtureList(context: FixtureBase[]) {
    if (!context) { console.error('nofixtureL'); debugger; return; }
    const res = this.fixtureStates.map((fs) => context.find((e) => e.name === fs.name));
    const defined = res.filter(e => !!e);
    if (defined.length !== res.length) {
      console.error('some saved fixture are deleted')
      debugger;
    }
    return defined;
  }
  public getSavedChannels(context: FixtureBase[]) {
    const res = new Array<ChannelBase>();
    for (const fs of this.fixtureStates) {
      const f = context.find((e) => e.name === fs.name);
      if (f) {
        let allChannelNames = Object.keys(fs.channelValues);
        allChannelNames = allChannelNames.concat(Object.keys(fs.channelCurveLinks));
        for (const name of allChannelNames) {
          const c = f.getChannelForName(name);
          if (c) { res.push(c); }
        }
      }

    }
    return res;
  }

  public findZombies() {
    const availableFixtureNames = this.__stateList?.getCurrentFullFixtureList().map(f => f.name) || []
    const zombieFixtures = this.fixtureStates.filter(f => !availableFixtureNames.includes(f.name))
    if (zombieFixtures.length) {
      return { fixtures: zombieFixtures }
    }
    return {}
  }




}


// @AccessibleClass()
export class StateList {
  get universe() {
    return this.__universe;
  }

  public static mergeStateList(sl: State[], context: FixtureBase[], otherStates: { [id: string]: State }, dimMasters?: number[]) {
    const rsl = new Array<ResolvedFixtureState>();
    if (!dimMasters) {
      dimMasters = [];
    }
    for (let i = 0; i < sl.length; i++) {
      dimMasters.push(1);
    }
    let resolved = new Array<ResolvedFixtureState>();
    for (let i = 0; i < sl.length; i++) {
      const st = sl[i];
      const dimMaster = dimMasters[i];
      resolved = resolved.concat(st.resolveState(context, otherStates, dimMaster));
    }
    StateList.mergeResolvedFixtureList(rsl, resolved);

    return rsl;
  }

  public static mergeResolvedFixtureList(rsl: ResolvedFixtureState[], newRsl: ResolvedFixtureState[]) {

    for (let i = 0; i < newRsl.length; i++) {
      const rs = newRsl[i];
      const stateForFix = rsl.find((e) => e.fixture === rs.fixture);
      if (stateForFix) {
        stateForFix.mergeWith(rs);
      } else {
        rsl.push(rs);
      }


    }
    return rsl;
  }

  @SetAccessible({
    onChange: (parent, el) => {
      console.log('state change ', el)
      debugger
      const path = findLocationInParent(el, "states")
      if (path?.length && path[0].__accessibleName === parent.loadedStateName) {
        const aPath = findLocationInParent(el, "actions")
        if (aPath?.length && aPath.length > 1)
          aPath[1].apply()
        return
      }
      console.error('cant trace state change ')

    }
  })
  public states: { [key: string]: State } = {};

  @ClientOnly()
  private presetableNames: string[] = [];
  @RemoteValue()
  public currentState = new State(this, 'current', [], [], true);
  @RemoteValue()
  public loadedStateName = '';
  @nonEnumerable()
  private __universe: Universe;
  constructor(uni: Universe) {
    this.__universe = uni;
    this.addState(blackState);
    // setChildAccessible(this.states,blackState.name) // needed to ensure name is not private (__black)
    this.addState(fullState);
    // setChildAccessible(this.states,fullState.name)
  }

  public configureFromObj(ob: any) {
    Object.keys(this.states).filter((e) => !e.startsWith('__')).map((name) => this.removeStateNamed(name));
    if (ob) {
      if (ob.states) {
        Object.keys(ob.states).map((name) => this.addState(State.createFromObj(ob.states[name], this)));
      }
      if (ob.currentState) {
        ob.currentState.name = this.currentState.name;
        this.currentState.configureFromObj(ob.currentState);
        this.recallState(this.currentState, 1, true);
      }
    }

  }

  get stateNames() {
    return Array.from(Object.keys(this.states))
  }

  @RemoteFunction({ sharedFunction: true })
  public removeStateNamed(name: string) {
    if (this.states[name]) {
      if (!(this.states[name] === blackState || this.states[name] === fullState)) {
        delete this.states[name];
      }
    }
  }

  public addState(s: State) {
    this.states[s.name] = s;
    // addProp(this.states, s.name,  s);
  }

  @RemoteFunction({ sharedFunction: true })
  public recallStateNamed(n: string, dimMaster = 1, setLoaded = true) {
    if (n === this.currentState.name) {
      return this.recallState(this.currentState, dimMaster, setLoaded);
    } else {
      return this.recallState(this.states[n], dimMaster, setLoaded);
    }
  }


  @RemoteFunction({ sharedFunction: true })
  public recallState(s: State, dimMaster: number, setLoaded: boolean) {
    if (!s) {
      console.error('calling null state');
      return;
    }
    sequencePlayer.stopIfPlaying();
    const fl = this.getCurrentFullFixtureList();
    if (!s.resolveState) {
      s = this.getStateNamed(s.name);
      if (!s) { debugger; console.error("invalid state"); return; }
    }
    const rs = s.resolveState(fl, this.states, dimMaster);

    this.applyResolvedState(rs);
    const channelList = s.getSavedChannels(fl);
    if (setLoaded) {
      this.setLoadedStateName(dimMaster > 0 ? s.name : "");
    }

    this.setPresetableNames(channelList.map((c) => c.getUID()));
    return channelList;
  }

  public getResolvedStateNamed(n: string, dimMaster = 1) {
    const s = this.states[n];
    return s.resolveState(this.getCurrentFullFixtureList(), this.states, dimMaster);

  }


  public setPresetableNames(l: string[]) {
    const oriLen = l.length;
    l = Array.from(new Set(l))
    if (l.length !== oriLen) {
      console.error("duplicated names in ", l)
    }
    if (l.length !== this.presetableNames.length || l.some(e => !this.presetableNames.includes(e))) {
      this.presetableNames = l;

    }

    this.checkPresetableIntegrity("");
  }
  public getPresetableNames() {
    return Object.assign({}, this.presetableNames);
  }


  public setNamePresetable(name: string, v: boolean) {
    if (v) {
      if (!this.presetableNames.includes(name)) {
        this.presetableNames.push(name);
      } else {
        debugger;
      }
      this.checkPresetableIntegrity(name)
    } else {
      const idx = this.presetableNames.indexOf(name);
      if (idx >= 0) {
        this.presetableNames.splice(idx, 1);
      }
    }
  }
  presetableListFromNames(p: string[]) {
    const res: any[] = []
    this.universe.fixtureList.map(f => {
      const df = f.channels.filter(c => p.includes(c.getUID()))
      if (df && df.length) {
        res.push(df)
      }
    })
    this.universe.groupList.map((g: FixtureGroup) => {
      const df = g.channels.filter(c => p.includes(c.getUID()))
      if (df && df.length) {
        res.push(df)
      }
    })
    return res

  }

  public namesFromPresetableState(p: FullStateObject) {
    const res = new Array<string>()
    for (const [fn, fs] of Object.entries(p)) {
      if (isValidChannelName(fn)) {
        for (const [cn, cs] of Object.entries(fs)) {
          if (isValidChannelName(cn)) {
            const c = this.universe.getFixtureNamed(fn)?.getChannelForName(cn)
            if (c && cs.preseted) {
              res.push(c.getUID())
            }
          }
        }
      }
    }

    return res;
  }
  public get presetableObjects() {
    return this.presetableListFromNames(this.presetableNames);
  }
  public isPreseted(o: { getUID: () => string }) {
    if (o && o.getUID) {
      return this.presetableNames.includes(o.getUID())
    }
    debugger
    return false
  }

  private checkPresetableIntegrity(fromPresetableName: string) {
    const toRm = new Set<string>()
    const removeGroup = !!this.universe.fixtureList.find(g => g.channels.find(c => c.getUID() === fromPresetableName))

    this.universe.groupList.map((g: FixtureGroup) => {
      g.channels.map((cg: ChannelGroup) => {
        const gName = cg.getUID();
        if (this.presetableNames.includes(gName)) {
          cg.channels.map(c => {
            const pName = c.getUID()
            if (this.presetableNames.indexOf(pName) >= 0) {
              toRm.add(removeGroup ? gName : pName)
            }
          })
        }
      })
    })


    Array.from(toRm).map(n => this.setNamePresetable(n, false))
  }

  public getCurrentFullFixtureList() {
    return (this.universe.groupList as Array<FixtureGroup | FixtureBase>).concat(this.universe.fixtureList);
  }

  // @RemoteFunction({ sharedFunction: true })
  public saveCurrentState(name: string, linkedStates?: LinkedState[], actions?: ActionList) {

    if (name !== this.currentState.name) {

      this.saveFromPresetableNames(name, this.presetableNames, linkedStates, actions);

    } else {
      this.updateCurrentState();

    }
  }
  @RemoteFunction({ sharedFunction: true, noRef: true })
  public saveFromPresetableNames(name: string, presetableNames: string[], linkedStates?: LinkedState[], actions?: ActionList) {

    const fl = this.getCurrentFullFixtureList();
    const st = new State(this, name, presetableNames || this.presetableNames, fl);
    if (linkedStates) { st.linkedStates = linkedStates; }
    if (actions) { st.actions = actions }
    this.addState(st);
    this.setLoadedStateName(st.name);
  }
  // @RemoteFunction({ sharedFunction: true ,noRef:true})
  // public saveFromPresetableObjects(name: string, presetableObject: FullStateObject, linkedStates?: LinkedState[], actions?: ActionList) {

  //   const fl = this.getCurrentFullFixtureList();

  //   const st = new State(this, name, presetableNames || this.presetableNames, fl);
  //   if (linkedStates) { st.linkedStates = linkedStates; }
  //   if (actions) { st.actions = actions }
  //   this.addState(st);
  //   this.setLoadedStateName(st.name);
  // }
  // @RemoteFunction({ sharedFunction: true ,noRef:true})
  // public saveFromPresetableObject(name: string, ob: any) {

  //   const fl = this.getCurrentFullFixtureList();
  //   const st = new State(this, name,[], fl);
  //   st.configureFromObj(ob);
  //   st.updateFromFixtures(fl);
  //   this.addState(st);
  //   this.setLoadedStateName(st.name);
  // }


  public setLoadedStateName(n: string) {
    if (n !== this.currentState.name) {
      this.loadedStateName = n;
    }
    else { console.error("can't set current to loaded") }
  }
  public updateCurrentState() {
    const fl = this.getCurrentFullFixtureList();
    this.currentState.updateFromFixtures(fl);
  }





  public renameState(oldName: string, newName: string) {
    const s = this.states[oldName];
    if (s) {
      s.name = newName;
      delete this.states[oldName];
      addProp(this.states, newName, s);
      if (this.loadedStateName === oldName) {
        this.loadedStateName = newName;
      }

    }
  }

  public getStateNamed(name: string) {
    return this.states[name];
  }

  private applyResolvedState(rs: ResolvedFixtureState[]) {
    rs.map((r) => r.applyFunction(
      (channel, value) => {
        CurvePlayer.removeChannel(channel);
        if (channel.parentFixture?.name === "Lazer" && channel.name === "shutter") {
          debugger
        }
        if (typeof (value) === 'number') {
          channel.setValue(value, true);
        } else {
          const cl = value as CurveLink;
          if (!CurvePlayer.hasCurveLink(cl)) {
            CurvePlayer.addCurveLink(cl);
          }
        }

      }));

  }


}





class WholeState extends State {
  constructor(name: string, public value: number) {
    super(undefined, name, [], []);
  }
  public resolveState(context: FixtureBase[], sl: { [id: string]: State }, dimMaster = 1): ResolvedFixtureState[] {
    const res: ResolvedFixtureState[] = [];
    const opt = {};
    const isIncluded = (c: ChannelBase) => {
      return (this.name === "__black" && c.roleFam === 'fog') || c.reactToMaster
    }
    for (const f of context) {
      f.channels.map((c) => { if (isIncluded(c)) { CurvePlayer.removeChannel(c); } });
      const fs = new FixtureState(f, { overrideValue: this.value, channelFilter: (c: ChannelBase) => isIncluded(c) });
      res.push(new ResolvedFixtureState(fs, f, dimMaster));
    }
    return res;
  }
}
export const blackState = new WholeState('__black', 0);
export const fullState = new WholeState('__full', 1.0);


// ////////////////////////
// // ACTION


// import { TypedActionInstance, InputCapType, TargetCapType } from './Actions'
