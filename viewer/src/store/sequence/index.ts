import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
import RootState from '@API/RootState';
import { Settable } from '../util';
import { ChannelBase } from '@API/Channel';
import { State } from '@API/State' ;
import { Sequence } from '@API/Sequence';

const player = RootState.sequencePlayer;

@Module({namespaced: true})
export default class Sequences extends VuexModule {


  public sequenceList = RootState.sequenceList;


  @Settable()
  public __curSequence = '';


  public selectedState?: State;

  @Action
  public configureFromObj(ob: any) {
    this.context.commit('clearSequences');
    if (ob.sequenceList ) {
      ob.sequenceList.forEach((o: any) => {
        const s = Sequence.createFromObj(o);
        if (s) {this.context.commit('addSequence', s); }
      });
    }
    // if (ob.curSequenceName) {this.context.commit('set__curSequenceName', ob.curSequenceName); }
  }

  @Action
  public saveCurrentSequence(pl: {name: string}) {
    pl = pl || {};
    // if(this.selectedState){
      // if (!pl.name) {
      //   pl.name = this.curSequenceName ? this.curSequenceName : 'seq';
      // }
      // const c = this.context.getters.sequences;
      // if(this.selectedState){
    const seq = new Sequence(pl.name, this.selectedState || '');
    this.context.commit('addSequence', seq);
    this.context.commit('set____curSequence', seq);
      // }
    }

    @Mutation
    public addSequence(s: Sequence) {
      if (s) {
        const i = this.sequenceList.findIndex((ss) => ss.name === s.name);
        if (i !== -1) {
          s.name = s.name + '.';
        }
        this.sequenceList.push( s);
      }
    }
    @Mutation
    public setSequenceName(pl: {sequence: Sequence, value: string} ) {
      pl.sequence.name = pl.value;
    }

    @Mutation
    public clearSequences( ) {
      this.sequenceList = new  Array<Sequence>();
    }

    @Mutation
    public setSequenceStateName(pl: {sequence: Sequence, value: string} ) {
      // const sv = this.availableStates.find((s) => s.name === pl.value);
      // if (sv) {
      //   // this.context.commit('setSequenceState', {sequence: pl.sequence, value: sv});
      // }
      pl.sequence.stateName = pl.value;
    }



    @Mutation
    public setSequenceTimeIn(pl: {sequence: Sequence, value: number} ) {
      pl.sequence.timeIn = pl.value;
    }

    @Mutation
    public setSequenceTimeOut(pl: {sequence: Sequence, value: number} ) {
      pl.sequence.timeOut = pl.value;
    }


    @Action
    public goToSequenceNamed(pl: {name: string}) {
      const s = this.sequenceList.find((f) => f.name === pl.name);
      if (s) {
        this.context.dispatch('goToSequence', s);
      }
    }
    @Action
    public goToSequence(sq: Sequence) {
      const self = this;

      player.goTo(
        sq,
        this.fixtureList,
        (n: string) =>
          self.context.getters.availableStates.find(
            (st: State) => st.name === n,
          ),
        (channel: ChannelBase, value: number) => {
          self.context.commit(
            'fixtures/setChannelValue',
            { channel, value },
            { root: true },
          );
        },
        () => {
          this.context.commit('set____curSequence', sq);
        },
      );
    }

    get fixtureList() {
      return this.context.rootState.universes.universe.fixtureList;

    }

    get availableStates(): State[] {

      return this.context.rootState.states.states;
    }








  }


