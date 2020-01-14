// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { Universe } from '@API/Universe';
import { FixtureBase, DirectFixture } from '@API/Fixture';

import { ChannelBase } from '@API/Channel.ts';
import RootState from '@API/RootState.ts';

// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

type FixtureType = FixtureBase;
type ChannelType = ChannelBase;




@Module({namespaced: true})
export default class Universes extends VuexModule {

  public universe = RootState.universe;

  @Action
  public configureFromObj(js: any) {
    this.context.commit('configureFromObjMut', js);
  }
  @Mutation
  public configureFromObjMut(js: any) {
    this.universe.configureFromObj(js.universe);
  }

  @Mutation
  public setGrandMasterValue(v: number) {
    this.universe.setGrandMaster(v);
  }
  @Mutation
  public addFixture(pl: {name: string, circs: number[] , channels?: ChannelBase[]}) {
    if (pl instanceof FixtureBase) {
      this.universe.addFixture(pl);
      return;
    }
    pl = pl || {name: 'fixture', circs: [1]};
    let {name, circs} = pl;
    if (!circs || !circs.length) {circs = [1]; }
    if (!name) {name = 'fixture'; }
    this.universe.addFixture(new DirectFixture(name, circs));
  }

  @Mutation
  public duplicateFixture(pl: {fixture: FixtureBase}) {
    const {fixture} = pl;
    const clone = new DirectFixture(fixture.name, []);
    this.universe.addFixture(clone); // register accessible before config
    const oldName = fixture.name;
    fixture.name = clone.name;
    clone.configureFromObj(fixture);
    fixture.name = oldName;
  }
  @Mutation
  public setFixtureName(pl: {fixture: FixtureBase, value: string}) {
    pl.fixture.setName(pl.value);
  }
  @Mutation
  public setFixtureValue(pl: {fixture: FixtureBase, value: number}) {
    pl.fixture.setMaster(pl.value);
  }
    @Mutation
  public setFixtureColor(pl: {fixture: FixtureBase, color: {r: number, g: number, b: number}, setWhiteToZero: boolean }) {
    pl.fixture.setColor(pl.color, pl.setWhiteToZero);
  }
  @Mutation
  public setAllColor(pl: { color: {r: number, g: number, b: number}, setWhiteToZero: boolean }) {
    this.universe.setAllColor(pl.color, pl.setWhiteToZero);
  }



  @Mutation
  public setFixtureBaseCirc(pl: {fixture: FixtureBase, circ: number}) {
    pl.fixture.baseCirc = pl.circ;
  }

  @Mutation
  public removeFixture(pl: {fixture: FixtureType}) {
    this.universe.removeFixture(pl.fixture);
  }

  @Mutation
  public linkChannelToCirc(pl: {channel: ChannelBase, circ: number}) {
    const {channel} = pl;
    const {circ} = pl;
    if (channel) {
      channel.setCirc(circ);
    }
  }


  @Mutation
  public setChannelValue(pl: {channel: ChannelBase , value: ChannelBase['floatValue'], dontNotify: any}) {
    const {  value, channel, dontNotify}  = pl;
    if (channel) {
      channel.setValue(value, dontNotify ? false : true);
    }
  }

  @Mutation
  public setChannelName(pl: {channel: ChannelBase , name: string}) {
    const {channel} = pl;
    const { name}  = pl;
    if (name !== channel.name) {
      const correspondigFixture = this.universe.fixtureList.find( (f) => f.channels.includes(channel) );
      if (!correspondigFixture) {
        console.error('fixture not managed');
      } else {
        channel.setName(name);
      }
    }
  }

  @Mutation
  public setChannelEnabled(pl: {channel: ChannelBase, value: boolean}) {
    const {value} = pl;
    const { channel}  = pl;
    if (value !== channel.enabled) {
      if (!this.universe.fixtureList.find( (f) => f.channels.includes(channel) )) {
        console.error('fixture not managed');
      }

      channel.enabled  =  value ? true : false;
    }
  }

  @Mutation
  public addChannelToFixture(pl: {fixture: FixtureBase}) {

    const c = pl.fixture.addChannel(undefined);

  }

  @Mutation
  public removeChannel(pl: {channel: ChannelBase, fixture: FixtureBase}) {
    pl.fixture.removeChannel(pl.channel);
  }

  @Mutation
  public testDimmerNum(dimmerNum: number  ) {
    this.universe.testDimmerNum(dimmerNum);
  }

  get testDimmerNumVal() {
    return this.universe.testedChannel.circ;
  }


  get usedCircs(): number[] {
    return Array.from(new Set<number>(this.usedChannels.map( (ch) => ch.circ).flat()));
  }

  get usedChannels(): ChannelBase[] {
    return this.universe.fixtureList.map((f) => f.channels).flat();
  }

  get grandMaster() {
    return this.universe.grandMaster;
  }






}


