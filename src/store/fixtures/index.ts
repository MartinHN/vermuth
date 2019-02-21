// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { DirectFixture } from '../../api/fixture';
import { ChannelBase } from '../../api/Channel';
import { DimmerBase } from '../../api/Dimmer';
// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

type FixtureType = DirectFixture;
type ChannelType = ChannelBase;

function getNextDimmer(fl: FixtureType[], d: number, forbidden?: number[]): number {
  const dimmersUsed = fl.map((ff) => ff.dimmer.circs).flat().concat(forbidden || []);
  while (dimmersUsed.indexOf(d) !== -1) {d += 1; }
  return d;
}

function getNextChannelName(fl: FixtureType[], name: string,originalName:string): string {
  if(!fl.find((f) => f.channel.name === name)){
    return name;
  }
    const nameSpl = name.split(' ');
    debugger;
    let idx = nameSpl.length > 0 ? parseInt(nameSpl[nameSpl.length - 1]) : NaN;
    if (idx===NaN && fl.find((f) => f.channel.name === name)) {idx = 0; }
    if (idx !== NaN) {
      idx += 1;
      const nameBase = nameSpl.slice(0, nameSpl.length - 1).join(' ');
      while (fl.find((f) => f.channel.name === nameBase + ' ' + idx) && originalName!==nameBase + ' ' + idx) {
        idx += 1;
      }

      name = nameBase + ' ' + idx;
    }

    return name;

}


@Module({namespaced: true})
export default class Fixtures extends VuexModule {
  // public dState: DimmerState;
  public fixtures = new  Array<FixtureType>();
  // public channels = new  Array<ChannelType>(new ChannelBase('fake'));

  @Mutation
  public addFixture(pl: {name: string, circs: number[]}) {
    let {name, circs} = pl;
    name = getNextChannelName(this.fixtures, name,name);

    const added = new Array<number>();
    for ( const i in circs) {
      const n = getNextDimmer(this.fixtures, circs[i], added);
      added.push(n);
      circs[i] = n;
    }

    this.fixtures.push(new DirectFixture(name, circs));
  }


  @Mutation
  public removeFixture(fixture: FixtureType) {
    const i = this.fixtures.indexOf(fixture);
    if (i >= 0) {this.fixtures.splice(i, 1); }
  }

  @Mutation
  public linkChannelToDimmer(pl: {channelName: string, dimmerNum: number, dimmerIdx: number}) {
    const {channelName, dimmerIdx} = pl;
    let {dimmerNum} = pl;
    const f = this.fixtures.find((ff) => ff.channel.name === channelName);
    if (f) {
      if (f.dimmer.circs[dimmerIdx] != dimmerNum) {dimmerNum =  getNextDimmer(this.fixtures, dimmerNum); }
      f.dimmer.setDimmerNum(dimmerNum, dimmerIdx);
    }
  }

  @Mutation
  public addChannelToDimmer(pl: {channelName: string, dimmerNum: number}) {
    let {channelName, dimmerNum} = pl;
    if (!dimmerNum) {dimmerNum = 1; }
    const f = this.fixtures.find((ff) => ff.channel.name === channelName);
    if (f) {
      const dimmersUsed = this.fixtures.map((ff) => ff.dimmer.circs).flat();
      while (dimmersUsed.indexOf(dimmerNum) !== -1) {dimmerNum += 1; }
      f.dimmer.addDimmer(dimmerNum);
    }
  }

  @Mutation
  public removeDimmerFromChannel(pl: {channelName: string, dimmerIdx: number}) {
    const {channelName, dimmerIdx} = pl;
    const f = this.fixtures.find((ff) => ff.channel.name === channelName);
    if (f) {
      f.dimmer.removeDimmer(dimmerIdx);
    }
  }



  @Mutation
  public setChannelValue(pl: {channelName: string , value: ChannelBase['value']}) {
    const {channelName , value}  = pl;
    const f = this.fixtures.find( (ff) => ff.channel.name === channelName);
    if (f) {
      f.sendValue(value);
    }
  }

  @Mutation
  public setChannelName(pl: {channel: ChannelBase , name: string}) {
    const {channel} = pl;
    let { name}  = pl;
    if(name!==channel.name){
      if (!this.fixtures.find( (f) => f.channel === channel )) {
       console.error('fixture not managed');
      }
      name = getNextChannelName(this.fixtures, name,channel.name);
      channel.name = name;
    }
  }


  get usedDimmers(): DimmerBase[] {
    return this.fixtures.map((f) => f.dimmer);
  }

  get usedCircs(): number[] {
    return Array.from(new Set<number>(this.usedDimmers.map( (d) => d.circs).flat()));
  }

  get usedChannels(): ChannelBase[] {
    return this.fixtures.map((f) => f.channel);
  }




}


