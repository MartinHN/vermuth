// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { DirectFixture } from '../../api/fixture';
import { State } from '../../api/State';

// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';



@Module({namespaced: true})
export default class States extends VuexModule {
  // public dState: DimmerState;
  public states = new  Array<State>();
  public stateName = '';
  @Action
  public fromObj(ob: any) {
    ob.states.map((o: any) => this.context.commit('addState', State.fromObj(o)));
    this.context.commit('setCurrentStateName', ob.stateName);
  }

  @Action
  public saveCurrentState(pl: {name: string}) {

    const c = this.context.getters.channels;
    const st = new State(pl.name, c);
    this.context.commit('addState', st);
    this.context.commit('setCurrentStateName', st.name);
  }

  @Mutation
  public addState(s: State) {
    const i = this.states.findIndex((ss) => ss.name === s.name);
    if (i === -1) {
      this.states.push( s);
    } else {
      this.states.splice(i, 1, s);
    }
  }

  @Mutation
  public setCurrentStateName(s: string) {
    this.stateName = s;
  }

  @Action
  public recallState(pl: {name: string}) {
    const s = this.states.find((f) => f.name === pl.name);
    if (s) {
      for (const c of s.channelValues) {
          this.context.commit('fixtures/setChannelValue', c, {root: true});
      }
      for (const c of this.context.getters.channels) {
        const found = s.channelValues.findIndex((cv) => cv.channelName === c.name) !== -1;
        this.context.commit('fixtures/setChannelEnabled', {channel: c, value: found}, {root: true});

      }
      this.context.commit('setCurrentStateName', pl.name);
    }

  }

  get channels() {
    return this.context.rootGetters['fixtures/usedChannels'];

  }

  get stateNames() {
    return this.states.map((s) => s.name);
  }






}


