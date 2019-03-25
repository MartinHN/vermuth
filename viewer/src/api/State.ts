import { ChannelBase } from './Channel';
import { FixtureBase, fixtureAll } from './Fixture';

type ChannelsValuesDicTypes = Map<string, number>;

export class FixtureState {
  get channelValues(): ChannelsValuesDicTypes {
    return Object.assign({}, this.pChannelValues) ;
  }
  public static fromObj(o: any): FixtureState {
    const res = new FixtureState(o.name);
    res.pChannelValues = o.pChannelValues; // .map( (oo: any) => res.pChannelValues[oo.channelName]= oo.value)) );
    return res;
  }
  public name: string;
  private pChannelValues: ChannelsValuesDicTypes = new Map<string, number>();
  constructor(fixture: FixtureBase | string) {
    if (typeof fixture === 'string') {
      this.name = fixture;
    } else {
      this.name = fixture.name;
      for (const c of fixture.channels) {
        if (c.enabled) {
          this.pChannelValues.set(c.name, c.value);
        }
      }
    }
  }

  public setAllValues(v: number) {
    this.pChannelValues.forEach( (_, k, m) => {m.set(k, v); });
  }
}

export class ResolvedFixtureState {
  public channels: { [id: string]: {channel: ChannelBase, value: number }} = {};

  constructor(public state: FixtureState, public fixture: FixtureBase) {
    this.state.channelValues.forEach((cv, k, m) => {
      const c = this.fixture.getChannelForName(k);
      if (c) {this.channels[c.name] = {channel: c, value: cv}; }
    });
  }

  public applyState() {
    Object.values(this.channels).map((cv) => {cv.channel.setValue(cv.value); });
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
          const sourcev = channel.value;
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

  public static fromObj(o: any): State {
    const res = new State(o.name, []);
    o.fixtureStates.map( (oo: any) => {
      const fs = FixtureState.fromObj(oo);
      if (fs) {
        res.fixtureStates.push(fs);
      }
    });
    return res;
  }
  public fixtureStates: FixtureState[] = [];
  constructor(public name: string, fixtures: FixtureBase[]) {
    for (const f of fixtures) {
      this.fixtureStates.push(new FixtureState(f));
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


export const blackState = new State('black', [fixtureAll]).setAllValues(0.0);
export const fullState = new State('full', [fixtureAll]).setAllValues(1.0);
