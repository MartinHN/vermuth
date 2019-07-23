// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { Universe } from '../../api/Universe';
import { FixtureBase, DirectFixture } from '../../api/Fixture';

import { ChannelBase } from '../../api/Channel';

// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

type FixtureType = FixtureBase;
type ChannelType = ChannelBase;






@Module({namespaced: true})
export default class Fixtures extends VuexModule {

  public universe = new Universe();
  public testedChannel :ChannelBase|undefined = undefined;
  public driverName = "none";

  @Action
  public fromObj(js: any) {
    this.context.commit('fromObjMut', js);
  }
  @Mutation
  public fromObjMut(js: any) {
    this.universe = Universe.fromObj(js.universe);
    this.driverName = js.driverName;

  }


  @Mutation
  public addFixture(pl: {name: string, circs: number[]}) {
    pl = pl || {name: 'fixture', circs: [1]};
    let {name, circs} = pl;
    if (!circs || !circs.length) {circs = [1]; }
    if (!name) {name = 'fixture'; }
    this.universe.addFixture(new DirectFixture(name, circs));
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
  public setChannelReactToMaster(pl: {channel: ChannelBase, value: boolean}) {
    pl.channel.reactToMaster = pl.value ? true : false;
  }
  @Mutation
  public sefFixtureBaseCirc(pl: {fixture: FixtureBase, circ: number}) {
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
  public setChannelValue(pl: {channel: ChannelBase , value: ChannelBase['floatValue'],dontNotify: any}) {
    const {  value, channel,dontNotify}  = pl;
    if (channel) {
      channel.setValue(value,dontNotify?false:true);
    }
  }

  @Mutation
  public setChannelName(pl: {channel: ChannelBase , name: string}) {
    const {channel} = pl;
    const { name}  = pl;
    if (name !== channel.name) {
      const correspondigFixture = this.universe.fixtures.find( (f) => f.channels.includes(channel) );
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
      if (!this.universe.fixtures.find( (f) => f.channels.includes(channel) )) {
        console.error('fixture not managed');
      }

      channel.enabled = value ? true : false;
    }
  }

  @Mutation
  public addChannelToFixture(pl: {fixture: FixtureBase}) {

    const c = pl.fixture.addChannel(undefined);

    c.setCirc(0);
  }

  @Mutation
  public removeChannel(pl: {channel: ChannelBase, fixture: FixtureBase}) {
    pl.fixture.removeChannel(pl.channel);
  }

  @Mutation
  public testChannel(pl: { channel: ChannelBase } ) {
    const { channel } = pl;
    if ( this.testedChannel) {
      this.context.commit('setChannelValue', { channel, value: 0.0});
    }
    this.testedChannel = channel;
    if ( this.testedChannel ) {
      this.context.commit('setChannelValue', { channel, value: 1.0});
    }


  }



  get usedCircs(): number[] {
    return Array.from(new Set<number>(this.usedChannels.map( (ch) => ch.circ).flat()));
  }

  get usedChannels(): ChannelBase[] {
    return this.universe.fixtures.map((f) => f.channels).flat();
  }






}


