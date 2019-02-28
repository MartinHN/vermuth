import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
import { Sequence,SequencePlayer } from '../../api/Sequence';




@Module({namespaced: true})
export default class Sequences extends VuexModule {
  // public dState: DimmerState;
  public sequences = new  Array<Sequence>();
  public sequenceName = '';

  @Action
  public fromObj(ob: any) {
    // if(ob.sequences)ob.sequences.map((o: any) => this.context.commit('addSequence', Sequence.fromObj(o)));
    if(ob.stateName)this.context.commit('setCurrentSequenceName', ob.stateName);
  }

  // @Action
  // public saveCurrentSequence(pl: {name: string}) {

  //   // const c = this.context.getters.sequences;
  //   const seq = new Sequence(pl.name);
  //   this.context.commit('addSequence', seq);
  //   this.context.commit('setCurrentSequenceName', st.name);
  // }

  // @Mutation
  // public addSequence(s: Sequence) {
  //   const i = this.sequences.findIndex((ss) => ss.name === s.name);
  //   if (i === -1) {
  //     this.sequences.push( s);
  //   } else {
  //     this.sequences.splice(i, 1, s);
  //   }
  // }

  // @Mutation
  // public setCurrentSequenceName(s: string) {
  //   this.sequenceName = s;
  // }

  // @Action
  // public goToSequence(pl: {name: string,settings:any}) {
  //   const s = this.sequences.find((f) => f.name === pl.name);
  //   if (s) {
  //     for (const c of s.channelValues) {
  //         this.context.commit('fixtures/setChannelValue', c, {root: true});
  //     }
  //     for (const c of this.context.getters.channels) {
  //       const found = s.channelValues.findIndex((cv) => cv.channelName === c.name) !== -1;
  //       this.context.commit('fixtures/setChannelEnabled', {channel: c, value: found}, {root: true});

  //     }
  //     this.context.commit('setCurrentStateName', pl.name);
  //   }

  // }

  // get channels() {
  //   return this.context.rootGetters['fixtures/usedChannels'];

  // }

  // get stateNames() {
  //   return this.states.map((s) => s.name);
  // }






}


