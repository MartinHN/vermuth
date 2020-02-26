import { ChannelBase } from './Channel';
import { FixtureBase } from './Fixture';
import { Universe } from './Universe';
import { sequencePlayer } from './Sequence';
import { nonEnumerable, RemoteFunction, AccessibleClass, setChildAccessible } from './ServerSync';
import {addProp, deleteProp} from './MemoryUtils';

import {CurvePlayer, CurveLink, CurveLinkStore} from './CurvePlayer';

interface ChannelsValuesDicTypes {[id: string]: number; }
interface ChannelsCurveLinkDicTypes {[id: string]: {uid: string}; }


type SavedValueType = number|CurveLink;
export class FixtureState {

  get channelValues(): ChannelsValuesDicTypes {
    return Object.assign({}, this.pChannelValues) ;
  }
  get channelCurveLinks(): ChannelsCurveLinkDicTypes {
    return Object.assign({}, this.pChannelCurveLinks) ;
  }

  public static createFromObj(o: any): FixtureState {
    const res = new FixtureState();
    res.configureFromObj(o);
    return res;
  }
  public name = '';
  private pChannelValues: ChannelsValuesDicTypes = {};
  private pChannelCurveLinks: ChannelsCurveLinkDicTypes = {};
  constructor(fixture?: FixtureBase , options?: {overrideValue?: number, channelFilter?: (c: ChannelBase) => boolean, full?: boolean}) {
    if (fixture === undefined) {return; }
    this.name = fixture.name;
    let validChs ;
    if (options && options.full) {
      validChs = fixture.channels;
    } else if (options && options.channelFilter) {
      validChs = fixture.channels.filter(options.channelFilter);
    } else {
      validChs = fixture.channels.filter((c) => c.enabled);
    }
    validChs.map((c) => {
      const curveLink = CurvePlayer.getCurveLinkForChannel(c);

      addProp(curveLink ? this.pChannelCurveLinks : this.pChannelValues,
        c.name,
        (options && options.overrideValue !== undefined) ?
        options.overrideValue :
        (curveLink && {uid: curveLink.uid}) ||
        c.floatValue,
        );
    });
  }

  public configureFromObj(o: any) {
    this.name = o.name;
    this.pChannelValues = o.pChannelValues ; // .map( (oo: any) => res.pChannelValues[oo.channelName]= oo.value)) );
    this.pChannelCurveLinks = o.pChannelCurveLinks;
  }


  public setAllValues(v: number) {
    Object.keys(this.pChannelValues).forEach((k) => { this.pChannelValues[k] = v; });
  }
}

export class ResolvedFixtureState {
  public channels: { [id: string]: {channel: ChannelBase, value: SavedValueType}} = {};

  constructor(public state: FixtureState, public fixture: FixtureBase, public dimMaster= 1) {
    Object.entries(this.state.channelValues).forEach(([k, cv]) => {
      const c = this.fixture.getChannelForName(k);
      if (c) {this.channels[c.name] = {channel: c, value: cv * dimMaster}; }
    });
    Object.entries(this.state.channelCurveLinks).forEach(([k, cv]) => {
      const c = this.fixture.getChannelForName(k);
      const curveLink = CurveLinkStore.getForUID(cv.uid);
      if (c && curveLink) {
        this.channels[c.name] = {channel: c, value: curveLink};
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
    Object.values(this.channels).map((cv) => {
      CurvePlayer.removeChannel(cv.channel);

      if (typeof(cv.value) === 'number') {
        cv.channel.setValue(cv.value, true);
      } else {
        const curveLink = cv.value as CurveLink;
        CurvePlayer.addCurveLink(curveLink);
      }
    });
  }
  public applyFunction(cb: (channel: ChannelBase, value: SavedValueType) => void) {
    Object.values(this.channels).map((cv) => {cb(cv.channel, cv.value); });
  }
}


class MergedChannel {
  constructor(public channel: ChannelBase, public sourcev: SavedValueType, public targetv: SavedValueType) {
    const sourceCurveLink  = this.sourceCurveLink();
    if (sourceCurveLink) {
      sourceCurveLink.autoSetChannelValue = false;
      this.sourceGetter = () => {
        return sourceCurveLink.value;

      };

    }
    const targetCurveLink  = this.targetCurveLink();
    if (targetCurveLink) {
      targetCurveLink.autoSetChannelValue = false;
      this.targetGetter = () => {
        return targetCurveLink.value;
      };
      CurvePlayer.addCurveLink(targetCurveLink);
    }



  }
  public sourceCurveLink() {
    return typeof(this.sourcev) !== 'number' ? this.sourcev as CurveLink : undefined;
  }
  public targetCurveLink() {
    return typeof(this.targetv) !== 'number' ? this.targetv as CurveLink : undefined;
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
    if ( sourcev !== targetv) {
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

export class LinkedState {
  constructor(public name: string, public dimMaster: number) {}
}

export class State {

  public static createFromObj(o: any): State {
    const res = new State(o.name, []);
    res.configureFromObj(o);
    return res;
  }

  public fixtureStates: FixtureState[] = [];
  public linkedStates: LinkedState[] = [];

  constructor(public name: string, fixtures: FixtureBase[], public full?: boolean) {
    this.updateFromFixtures(fixtures);
    this.full = full ? true : false;
  }

  public configureFromObj(o: any) {
    this.name = o.name;
    this.fixtureStates = [];
    o.fixtureStates.map( (oo: any) => {
      const fs = FixtureState.createFromObj(oo);
      if (fs) {
        this.fixtureStates.push(fs);
      }
    });
    this.linkedStates = [];
    if (o.linkedStates) {
      o.linkedStates.map((oo: any) => {
        this.linkedStates.push(new LinkedState(oo.name, oo.dimmerMod));
      });
    }
    this.full = o.full;
  }
  public get hasLinked() {
    return this.linkedStates.length > 0;
  }

  public updateFromFixtures( fixtures: FixtureBase[]) {
    this.fixtureStates = [];
    const opts = {full: this.full};
    for (const f of fixtures) {
      this.fixtureStates.push(new FixtureState(f, opts));
    }
  }





  public setAllValues(v: number) {
    for (const f of this.fixtureStates) {
      f.setAllValues(v);
    }
    return this;
  }

  public resolveState(context: FixtureBase[], sl: {[id: string]: State}, dimMaster: number): ResolvedFixtureState[] {

    const res: ResolvedFixtureState[] = [];

    for (const f of this.fixtureStates) {
      const fix = context.find((ff) => ff.name === f.name);
      if (fix) {
        res.push(new ResolvedFixtureState(f, fix, dimMaster));
      }
    }
    let otherRs: ResolvedFixtureState[] = [];
    this.linkedStates.map((s) => {
      const os = sl[s.name];
      if (os) { otherRs = otherRs.concat(os.resolveState(context, sl, s.dimMaster)); } else {console.error('fuck states'); }});

    StateList.mergeResolvedFixtureList(otherRs, res); // this state should override linked



    return otherRs;
  }

  public getSavedFixtureList(context: FixtureBase[]) {
    if (!context) {console.error('nofixtureL'); debugger; return; }
    const res = this.fixtureStates.map((fs) => context.find((e) => e.name === fs.name));
    return res;
  }
  public getSavedChannels(context: FixtureBase[], recurse= false) {
    const res = new Array<ChannelBase>();
    for ( const fs of this.fixtureStates) {
      const f = context.find((e) => e.name === fs.name);
      if (f) {
        let allChannelNames = Object.keys(fs.channelValues);
        allChannelNames = allChannelNames.concat(Object.keys(fs.channelCurveLinks));
        for (const  name of allChannelNames) {
          const c =  f.getChannelForName(name);
          if (c) {res.push(c); }
        }
      }

    }
    return res;
  }






}


@AccessibleClass()
export class StateList {
  get universe() {
    return this.__universe;
  }

  public static  mergeStateList(sl: State[], context: FixtureBase[], otherStates: {[id: string]: State}, dimMasters?: number[]) {
    const rsl = new Array<ResolvedFixtureState>();
    if (!dimMasters) {
      dimMasters = [];
    }
    for (let i = 0 ; i < sl.length ; i++) {
      dimMasters.push(1);
    }
    let resolved = new Array<ResolvedFixtureState>();
    for (let i = 0 ; i < sl.length ; i++) {
      const st = sl[i];
      const dimMaster = dimMasters[i];
      resolved = resolved.concat(st.resolveState(context, otherStates, dimMaster));
    }
    StateList.mergeResolvedFixtureList(rsl, resolved);

    return rsl;
  }

  public static mergeResolvedFixtureList(rsl: ResolvedFixtureState[], newRsl: ResolvedFixtureState[]) {

    for (let i = 0 ; i < newRsl.length ; i++) {
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
  public states: {[key: string]: State} = {};
  public currentState = new State('current', [], true);
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
    Object.keys(this.states).map((name) => this.removeStateNamed( name) );
    if (ob.states) {
      Object.keys(ob.states).map((name) => this.addState(State.createFromObj(ob.states[name])));
    }
    if (ob.currentState) {
      ob.currentState.name = this.currentState.name;
      this.currentState.configureFromObj(ob.currentState);
      this.recallState(this.currentState, 1);
    }


  }

  @RemoteFunction({sharedFunction: true})
  public removeStateNamed(name: string) {
    if (this.states[name]) {
      if (!(this.states[name] === blackState || this.states[name] === fullState)) {
        deleteProp(this.states, name);
      }
    }
  }

  public addState(s: State) {
    this.states[s.name] = s;
    // addProp(this.states, s.name,  s);
  }

  @RemoteFunction({sharedFunction: true})
  public recallStateNamed(n: string, dimMaster= 1) {
    if (n === this.currentState.name) {
      this.recallState(this.currentState, dimMaster);
    } else {
      this.recallState(this.states[n], dimMaster);
    }
  }


  @RemoteFunction({sharedFunction: true})
  public recallState(s: State, dimMaster: number) {
    if (!s) {
      console.error('calling null state');
      return;
    }
    sequencePlayer.stopIfPlaying();
    const fl = this.getCurrentFullFixtureList();
    if (!s.resolveState) {
      s = this.getStateNamed(s.name);
      if (!s) {debugger; }
    }
    const rs = s.resolveState(fl, this.states, dimMaster);
    this.applyResolvedState(rs);
    const channelList = s.getSavedChannels(fl, false);
    for (const c of this.universe.allChannels) {
    const found = channelList.find((cc) => cc === c);
    c.enabled =  found !== undefined;
  }
    this.setLoadedStateName(s.name);
}

public getResolvedStateNamed(n: string, dimMaster= 1) {
  const s = this.states[n];
  return  s.resolveState(this.getCurrentFullFixtureList(), this.states, dimMaster);

}


public getCurrentFullFixtureList() {
  return this.universe.fixtureList;
}

@RemoteFunction({sharedFunction: true})
public saveCurrentState(name: string, linkedStates?: LinkedState[]) {



  if (name !== this.currentState.name) {
    const fl = this.getCurrentFullFixtureList();
    const st = new State(name, fl);
    if (linkedStates) {st.linkedStates = linkedStates; }
    this.addState(st);
    this.setLoadedStateName(st.name);

  } else {
    this.updateCurrentState();

  }
}

public setLoadedStateName(n: string) {
  this.loadedStateName = n;
}
public updateCurrentState() {
  const fl = this.getCurrentFullFixtureList();
  this.currentState.updateFromFixtures(fl);
}





public renameState(oldName: string, newName: string) {
  const s = this.states[oldName];
  if (s) {
    s.name = newName;
    deleteProp(this.states, oldName);
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

      if (typeof(value) === 'number') {
        channel.setValue( value, true);
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
    super(name, []);
  }
  public resolveState(context: FixtureBase[], sl: {[id: string]: State}, dimMaster= 1): ResolvedFixtureState[] {
    const res: ResolvedFixtureState[] = [];
    const opt = {};
    for (const f of context) {
      f.channels.map((c) => {if (c.reactToMaster) {CurvePlayer.removeChannel(c); }});
      const fs = new FixtureState(f, {overrideValue: this.value, channelFilter: (c: ChannelBase) => c.reactToMaster});
      res.push(new ResolvedFixtureState(fs, f, dimMaster));
    }
    return res;
  }
}
export const blackState = new WholeState('__black', 0);
export const fullState = new WholeState('__full', 1.0);
