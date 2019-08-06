import { ChannelBase } from './Channel';
import { FixtureBase } from './Fixture';
import { Universe } from './Universe';
import {deleteProp, addProp} from './MemoryUtils';
interface ChannelsValuesDicTypes {[id: string]: number; }

export class FixtureState {

  get channelValues(): ChannelsValuesDicTypes {
    return Object.assign({}, this.pChannelValues) ;
  }

  public static createFromObj(o: any): FixtureState {
    const res = new FixtureState();
    res.configureFromObj(o);
    return res;
  }
  public name = '';
  private pChannelValues: ChannelsValuesDicTypes = {};
  constructor(fixture?: FixtureBase , options?: {overrideValue?: number, pickOnlyDimmable?: boolean, full?: boolean}) {
    if (fixture === undefined) {return; }
    this.name = fixture.name;
    let validFix ;
    if (options && options.full) {
      validFix = fixture.channels;
    } else if (options && options.pickOnlyDimmable) {
      validFix = fixture.channels.filter((c) => c.reactToMaster);
    } else {
      validFix = fixture.channels.filter((c) => c.enabled);
    }
    validFix.map((c) => {this.pChannelValues[c.name] =  (options && options.overrideValue !== undefined) ? options.overrideValue : c.floatValue; });
  }

  public configureFromObj(o: any) {
    this.name = o.name;
    this.pChannelValues = o.pChannelValues ; // .map( (oo: any) => res.pChannelValues[oo.channelName]= oo.value)) );
  }


  public setAllValues(v: number) {
    Object.keys(this.pChannelValues).forEach((k) => { this.pChannelValues[k] = v; });
  }
}

export class ResolvedFixtureState {
  public channels: { [id: string]: {channel: ChannelBase, value: number }} = {};

  constructor(public state: FixtureState, public fixture: FixtureBase) {
    Object.entries(this.state.channelValues).forEach(([k, cv]) => {
      const c = this.fixture.getChannelForName(k);
      if (c) {this.channels[c.name] = {channel: c, value: cv}; }
    });
  }

  public applyState() {
    Object.values(this.channels).map((cv) => {cv.channel.setFloatValue(cv.value, true); });
  }
  public applyFunction(cb: (channel: ChannelBase, value: number) => void) {
    Object.values(this.channels).map((cv) => {cb(cv.channel, cv.value); });
  }
}

export class MergedState {
  public channels: Array<{channel: ChannelBase, sourcev: number, targetv: number }> = [];
  constructor(public target: ResolvedFixtureState[]) {
    // const sourceNames = Object.keys(source.channels)
    // const targetNames = Object.keys(target.channels)
    // const allNames = new Set(targetNames)
    for (const rfs of target) {
      const sourceFixture = rfs.fixture;
      if (sourceFixture) {
        for (const i of Object.keys(rfs.channels)) {
          const channelObj = rfs.channels[i];
          const channel = channelObj.channel;
          const sourcev = channel.floatValue;
          const targetv = channelObj.value;
          this.channels.push({channel, sourcev, targetv});
        }
      }
    }
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


export class State {

  public static createFromObj(o: any): State {
    const res = new State(o.name, []);
    res.configureFromObj(o);
    return res;
  }

  public fixtureStates: FixtureState[] = [];

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
    this.full = o.full;
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

  public resolveState(context: FixtureBase[]): ResolvedFixtureState[] {
    const res: ResolvedFixtureState[] = [];
    for (const f of this.fixtureStates) {
      const fix = context.find((ff) => ff.name === f.name);
      if (fix) {
        res.push(new ResolvedFixtureState(f, fix));
      }
    }
    return res;
  }
  public recall(context: FixtureBase[], cb: (channel: ChannelBase, value: number) => void | undefined) {
    const rs = this.resolveState(context);
    if (cb) {
      rs.map((s) => s.applyFunction(cb));
    } else {
      rs.map((s) => s.applyState());
    }
  }



}

export class StateList {
  public states: {[key: string]: State} = {};
  public currentState = new State('current', [], true);
  public loadedStateName = '';

  constructor(public universe: Universe) {
    this.addState(blackState);
    this.addState(fullState);
  }

  public configureFromObj(ob: any) {
    if (ob.states) {
      Object.keys(this.states).map((name) => this.removeStateNamed( name) );
      Object.keys(ob.states).map((name) => this.addState(State.createFromObj(ob.states[name])));
    }
    if (ob.currentState) {
      ob.currentState.name = this.currentState.name;
      this.currentState.configureFromObj(ob.currentState);
      this.recallState(this.currentState);
    }


  }


  public removeStateNamed(name: string) {
    if (this.states[name]) {
      if (!(this.states[name] === blackState || this.states[name] === fullState)) {
        deleteProp(this.states, name);
      }
    }
  }

  public addState(s: State) {
    if (s === blackState || s === fullState) {
      addProp(this.states, s.name, s);
    } else {
    addProp(this.states, s.name, s);
    }
  }

  public recallStateNamed(n: string) {
    if (n === this.currentState.name) {
      this.recallState(this.currentState);
    } else {
      this.recallState(this.states[n]);
    }
  }
  public recallState(s: State) {
    const rs = s.resolveState(this.getCurrentFixtureList());
    rs.map((r) => r.applyFunction((channel, value) => channel.setValue( value, true)));
    for (const c of this.universe.allChannels) {
      const found = rs.find((r) =>
        Object.values(r.channels)
        .find((v) => v.channel === c) !== undefined,
        );
      c.enabled =  found !== undefined;
    }
    this.setLoadedStateName(s.name);

  }

  public getCurrentFixtureList() {
    return this.universe.fixtureList;
  }

  public saveCurrentState(name: string) {



    if (name !== this.currentState.name) {
      const fl = this.getCurrentFixtureList();
      const st = new State(name, fl);
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
    const fl = this.getCurrentFixtureList();
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



}





class WholeState extends State {
  constructor(name: string, public value: number) {
    super(name, []);
  }
  public resolveState(context: FixtureBase[]): ResolvedFixtureState[] {
    const res: ResolvedFixtureState[] = [];
    const opt = {};
    for (const f of context) {
      const fs = new FixtureState(f, {overrideValue: this.value, pickOnlyDimmable : true});
      res.push(new ResolvedFixtureState(fs, f));
    }
    return res;
  }
}
export const blackState = new WholeState('__black', 0);
export const fullState = new WholeState('__full', 1.0);
