import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
import { Sequence, SequencePlayer } from '../../api/Sequence';
import { State } from '../../api/State';
import { Settable } from '../util';
import { ChannelBase } from '../../api/Channel';

const player = new SequencePlayer ();

@Module({namespaced: true})
export default class Sequences extends VuexModule {
  // public dState: DimmerState;

  public sequences = new  Array<Sequence>();

  @Settable()
  public __curSequence = '';


  public selectedState?: State;

  @Action
  public fromObj(ob: any) {
    this.context.commit('clearSequences');
    if (ob.sequences ) {
      ob.sequences.forEach((o: any) => {
        const s = Sequence.fromObj(o);
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
        const i = this.sequences.findIndex((ss) => ss.name === s.name);
        if (i !== -1) {
          s.name = s.name + '.';
        }
        this.sequences.push( s);
      }
    }
    @Mutation
    public setSequenceName(pl: {sequence: Sequence, value: string} ) {
      pl.sequence.name = pl.value;
    }

    @Mutation
    public clearSequences( ) {
      this.sequences = new  Array<Sequence>();
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
      const s = this.sequences.find((f) => f.name === pl.name);
      if (s) {
        this.context.dispatch('goToSequence', s);
      }
    }
    @Action
    public goToSequence(sq: Sequence) {
      const self = this;

      player.goTo(
        sq,
        this.fixtures,
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

    get fixtures() {
      return this.context.rootState.fixtures.fixtures;

    }

    get availableStates(): State[] {

      return this.context.rootState.states.states;
    }








  }


