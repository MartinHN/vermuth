// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { DirectFixture , FixtureBase} from '../../api/Fixture';
import { State } from '../../api/State';

// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';



@Module({namespaced: true})
export default class States extends VuexModule {

  public states = new  Array<State>();
  public currentState = new State('current', []);
  public stateName = '';

  @Action
  public fromObj(ob: any) {
    ob.states.map((o: any) => this.context.commit('addState', State.fromObj(o)));
    if (ob.currentState) {
      this.context.commit('addState', State.fromObj(ob.currentState));
      this.context.dispatch('recallState', {name: this.currentState.name});
    }
  }

  @Action
  public saveCurrentState(pl: {name: string}) {

    const c = this.context.getters.fixtures;

    if (pl.name !== this.currentState.name) {

      const st = new State(pl.name, c);
      this.context.commit('addState', st);
      this.context.commit('setCurrentStateName', st.name);
    } else {
      this.context.commit('updateCurrentState', c);

    }
  }

  @Mutation
  public addState(s: State) {
    if (s.name === this.currentState.name) {
      this.currentState = s;
    }

    const i = this.states.findIndex((ss) => ss.name === s.name);
    if (i === -1) {
      this.states.push( s);
    } else {
      this.states.splice(i, 1, s);
    }
  }
  @Mutation
  public updateCurrentState(fixtureList: FixtureBase[]) {
    this.currentState.updateFromFixtures(fixtureList);
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
    let s = this.states.find((f) => f.name === pl.name);
    if (pl.name === this.currentState.name) {
      s = this.currentState;
    }
    if (s) {
      const rs = s.resolveState(this.context.getters.fixtures);
      rs.map((r) => r.applyFunction((channel, value) => {
        this.context.commit('fixtures/setChannelValue', {channel, value}, {root: true});
      }));
      for (const c of this.context.getters.channels) {
        const found = rs.find((r) =>
          Object.values(r.channels)
          .find((v) => v.channel === c) !== undefined,
          );
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
    return this.context.rootState.fixtures.universe.fixtures;
  }
  get cleanStateNames(): string[] {
    return this.states.map((s) => s.name).filter((n) => n !== 'current');
    // return this.stateNames//

  }






}


