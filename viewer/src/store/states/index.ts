// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { DirectFixture } from '../../api/Fixture';
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
    const c = this.context.getters.fixtures;
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
  public removeState(pl: {name: string}) {
    const i = this.states.findIndex((ss) => ss.name === pl.name);
    if (i !== -1) {
      this.states.splice(i, 1);
    }
  }
  @Mutation
  public renameState(pl: {oldName: string, newName: string}) {
    const s = this.states.find((ss) => ss.name === pl.oldName);
    if (s) {
      s.name = pl.newName;
      if (this.stateName === pl.oldName) {
        this.stateName = pl.newName;
      }

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
      const rs = s.resolveState(this.context.getters.fixtures);
      rs.map((r) => r.applyFunction((channel, value) => {
        this.context.commit('fixtures/setChannelValue', {channel, value}, {root: true});
      }));
      for (const c of this.context.getters.channels) {
        const found = rs.find((r) =>
          Object.values(r.channels).find(

            (v) => v.channel === c) !== undefined);
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

  get fixtures() {
    return this.context.rootState.fixtures.fixtures;
  }






}


