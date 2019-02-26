// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { DirectFixture } from '../../api/fixture';
import { ChannelBase } from '../../api/Channel';
import { DimmerBase } from '../../api/Dimmer';
// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

type FixtureType = DirectFixture;
type ChannelType = ChannelBase;

function getNextDimmer(fl: FixtureType[], d: number, forbidden?: number[]): number {
  const dimmersUsed = fl.map((ff) => ff.dimmers).flat().map((dm) => dm.circ).concat(forbidden || []);
  while (dimmersUsed.indexOf(d) !== -1) {d += 1; }
  return d;
}

function getNextChannelName(fl: FixtureType[], name: string, originalName: string): string {
  if (!fl.find((f) => f.channel.name === name)) {
    return name;
  }
  function joinNBI(nameBase: string, idx: number): string {
    return nameBase.length ? nameBase + ' ' + idx : '' + idx;
  }

  const nameSpl = name.split(' ');
  let idx = nameSpl.length > 0 ? parseInt(nameSpl[nameSpl.length - 1], 10) : NaN;
  if (isNaN(idx) && fl.find((f) => f.channel.name === name)) {idx = 0; nameSpl.push('0'); }
  if (!isNaN(idx)) {
      idx += 1;
      const nameBase = nameSpl.slice(0, nameSpl.length - 1).join(' ');
      while (fl.find((f) => f.channel.name === joinNBI(nameBase, idx)) && originalName !== joinNBI(nameBase, idx)) {
        idx += 1;
      }

      name = joinNBI(nameBase, idx);
    }

  return name;

}


@Module({namespaced: true})
export default class Fixtures extends VuexModule {
  // public dState: DimmerState;
  public fixtures = new  Array<FixtureType>();
  // public channels = new  Array<ChannelType>(new ChannelBase('fake'));
  @Mutation
  public fromObj(js:any){
    this.fixtures = js.fixtures.map((o:any) => {
      return DirectFixture.fromObj(o)
    })
  }

  @Mutation
  public addFixture(pl: {name: string, circs: number[]}) {
    pl = pl || {name: 'channel', circs: [1]};
    let {name} = pl;
    const {circs} = pl;
    if (!name) {name = 'channel'; }
    name = getNextChannelName(this.fixtures, name, name);

    const added = new Array<number>();
    for ( const i in circs) {
      const n = getNextDimmer(this.fixtures, circs[i], added);
      added.push(n);
      circs[i] = n;
    }

    this.fixtures.push(new DirectFixture(name, circs));
  }


  @Mutation
  public removeFixture(pl:{channelName: string}) {
    const i = this.fixtures.findIndex(f => f.channel.name===pl.channelName);
    if (i >= 0) {this.fixtures.splice(i, 1); }
  }

  @Mutation
  public linkChannelToDimmer(pl: {channelName: string, dimmerNum: number, dimmerIdx: number}) {
    const {channelName, dimmerIdx} = pl;
    let {dimmerNum} = pl;
    const f = this.fixtures.find((ff) => ff.channel.name === channelName);
    if (f) {
      if (f.dimmers[dimmerIdx].circ !== dimmerNum) {dimmerNum =  getNextDimmer(this.fixtures, dimmerNum); }
      f.setDimmerNum(dimmerNum, dimmerIdx);
    }
  }

  @Mutation
  public addDimmerToChannel(pl: {channelName: string, dimmerNum: number}) {
    let {dimmerNum} = pl;
    const {channelName} = pl;
    if (!dimmerNum) {dimmerNum = 1; }
    const f = this.fixtures.find((ff) => ff.channel.name === channelName);
    if (f) {
      dimmerNum = getNextDimmer(this.fixtures, dimmerNum);
      f.addDimmer(dimmerNum);
    }
  }

  @Mutation
  public removeDimmerFromChannel(pl: {channelName: string, dimmerIdx: number}) {
    const {channelName, dimmerIdx} = pl;
    const f = this.fixtures.find((ff) => ff.channel.name === channelName);
    if (f) {
      f.removeDimmer(dimmerIdx);
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
    if (name !== channel.name) {
      if (!this.fixtures.find( (f) => f.channel === channel )) {
       console.error('fixture not managed');
      }
      name = getNextChannelName(this.fixtures, name, channel.name);
      channel.name = name;
    }
  }

  @Mutation
  public setChannelEnabled(pl:{channel:ChannelBase, value:boolean}){
        const {value} = pl;
    let { channel}  = pl;
    if (value !== channel.enabled) {
      if (!this.fixtures.find( (f) => f.channel === channel )) {
       console.error('fixture not managed');
      }
      
      channel.enabled = value;
    }
  }


  get usedDimmers(): DimmerBase[] {
    return this.fixtures.map((f) => f.dimmers).flat();
  }

  get usedCircs(): number[] {
    return Array.from(new Set<number>(this.usedDimmers.map( (d) => d.circ).flat()));
  }

  get usedChannels(): ChannelBase[] {
    return this.fixtures.map((f) => f.channel);
  }




}


