// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { FixtureBase, DirectFixture } from '../../api/Fixture';
import { ChannelBase } from '../../api/Channel';
import { DimmerBase } from '../../api/Dimmer';
// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

type FixtureType = FixtureBase;
type ChannelType = ChannelBase;

function getNextDimmer(fl: FixtureType[], d: number, forbidden?: number[]): number {
  const dimmersUsed = fl.map((ff) => ff.getAllDimmers()).flat().map((dm) => dm.circ).concat(forbidden || []);
  while (dimmersUsed.indexOf(d) !== -1) {d += 1; }
  return d;
}

function getNextUniqueName(nameList: string[], name: string, originalName: string): string {
  if (name===originalName){
    return name;
  }
  if(nameList.indexOf(name)===-1){
    return name;
  }

  function joinNBI(nameBase: string, pidx: number): string {
    return nameBase.length ? nameBase + ' ' + pidx : '' + pidx;
  }

  const nameSpl = name.split(' ');
  let idx = nameSpl.length > 0 ? parseInt(nameSpl[nameSpl.length - 1], 10) : NaN;
  if (isNaN(idx)) {idx = 0; nameSpl.push('0'); }
  
  idx += 1;
  const nameBase = nameSpl.slice(0, nameSpl.length - 1).join(' ');
  while ( (nameList.indexOf(joinNBI(nameBase, idx)) !== -1) && originalName !== joinNBI(nameBase, idx)) {
    idx += 1;

  }

  name = joinNBI(nameBase, idx);


  return name;

}



@Module({namespaced: true})
export default class Fixtures extends VuexModule {
  // public dState: DimmerState;
  public fixtures = new  Array<FixtureType>();
  // public channels = new  Array<ChannelType>(new ChannelBase('fake'));
  @Mutation
  public fromObj(js: any) {
    this.fixtures = [];
    for (const f of js.fixtures) {
      const df = FixtureBase.fromObj(f);
      if (df) {
        this.fixtures.push(df);
      }
    }

  }

  @Mutation
  public addFixture(pl: {name: string, circs: number[]}) {
    pl = pl || {name: 'fixture', circs: [1]};
    let {name, circs} = pl;
    if(!circs || !circs.length){circs = [1];}
    if (!name) {name = 'fixture'; }
    name = getNextUniqueName(this.fixtures.map(f=>f.name), name, '');

    const added = new Array<number>();
    circs = circs.map((c) => {
      const n = getNextDimmer(this.fixtures, c, added);
      added.push(n);
      return n;
    });
    this.fixtures.push(new DirectFixture(name, circs));
  }

  @Mutation
  public setFixtureName(pl:{fixture:FixtureBase,value:string}){
    pl.fixture.name = getNextUniqueName(this.fixtures.map(f=>f.name),pl.value,pl.fixture.name)
  }

  @Mutation
  public removeFixture(pl: {fixture: FixtureType}) {
    const i = this.fixtures.findIndex((f) => f === pl.fixture);
    if (i >= 0) {this.fixtures.splice(i, 1); }
  }

  @Mutation
  public linkChannelToDimmer(pl: {channel: ChannelBase, dimmerNum: number, dimmerIdx: number}) {
    const {channel, dimmerIdx} = pl;
    let {dimmerNum} = pl;

    if (channel) {
      if (channel.dimmers[dimmerIdx].circ !== dimmerNum) {
        dimmerNum =  getNextDimmer(this.fixtures, dimmerNum);
      }
      channel.setDimmerNum(dimmerNum, dimmerIdx);
    }
  }

  @Mutation
  public addDimmerToChannel(pl: {channel: ChannelBase, dimmerNum: number}) {
    let {dimmerNum} = pl;
    const {channel} = pl;
    if (!dimmerNum) {dimmerNum = 1; }
    if (channel) {
      dimmerNum = getNextDimmer(this.fixtures, dimmerNum);
      channel.addDimmer(dimmerNum);
    }
  }

  @Mutation
  public removeDimmerFromChannel(pl: {channel: ChannelBase, dimmerIdx: number}) {
    const {channel, dimmerIdx} = pl;
    if (channel) {
      channel.removeDimmer(dimmerIdx);
    }
  }



  @Mutation
  public setChannelValue(pl: {channel: ChannelBase , value: ChannelBase['value']}) {
    const {  value, channel}  = pl;
    if (channel) {
      channel.setValue(value);
    }
  }

  @Mutation
  public setChannelName(pl: {channel: ChannelBase , name: string}) {
    const {channel} = pl;
    let { name}  = pl;
    if (name !== channel.name) {
      const correspondigFixture = this.fixtures.find( (f) => f.channels.includes(channel) )
      if (!correspondigFixture) {
       console.error('fixture not managed');
     }
     else{
     name = getNextUniqueName(correspondigFixture.channels.map(c=>c.name), name, channel.name);
     channel.name = name;
    }
   }
 }

 @Mutation
 public setChannelEnabled(pl: {channel: ChannelBase, value: boolean}) {
  const {value} = pl;
  const { channel}  = pl;
  if (value !== channel.enabled) {
    if (!this.fixtures.find( (f) => f.channels.includes(channel) )) {
     console.error('fixture not managed');
   }

   channel.enabled = value?true:false;
 }
}

@Mutation
public addChannelToFixture(pl:{fixture: FixtureBase}){
  pl.fixture.addChannel(undefined);
}


get usedDimmers(): DimmerBase[] {
  return this.fixtures.map((f) => f.getAllDimmers()).flat();
}

get usedCircs(): number[] {
  return Array.from(new Set<number>(this.usedDimmers.map( (d) => d.circ).flat()));
}

get usedChannels(): ChannelBase[] {
  return this.fixtures.map((f) => f.channels).flat();
}




}


