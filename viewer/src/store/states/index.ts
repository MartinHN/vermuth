// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';
import { DirectFixture , FixtureBase} from '@API/Fixture';
import { StateList, State } from '@API/State';
import RootState from '@API/RootState';
import Vue from 'vue';

// import { RootState } from '../types';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';



@Module({namespaced: true})
export default class States extends VuexModule {

  public stateList = RootState.stateList;

  @Action
  public configureFromObj(ob: any) {
    this.context.commit('configureFromObjMut', ob);
  }
  @Mutation
  public configureFromObjMut(ob: any) {
    this.stateList.configureFromObj(ob);
  }

  @Mutation
  public saveCurrentState(pl: {name: string}) {
    this.stateList.saveCurrentState(pl.name);
  }

  @Mutation
  public addState(s: State) {
    this.stateList.addState(s);
    // Vue.set(this.states, s.name,  s);
  }

  @Mutation
  public removeState(pl: {name: string}) {
    this.stateList.removeStateNamed(pl.name);
  }
  @Mutation
  public renameState(pl: {oldName: string, newName: string}) {
    this.stateList.renameState(pl.oldName, pl.newName);
      // Vue.set(this.states, pl.newName,  s);
      // Vue.delete(this.states, pl.oldName);
  }


  @Mutation
  public setCurrentStateName(s: string) {
    this.stateList.setLoadedStateName(s);
  }

  @Mutation
  public recallState(pl: {name: string}) {
    this.stateList.recallStateNamed(pl.name);

  }

  get channels() {
    return this.context.rootGetters['universes/usedChannels'];

  }

  get stateNames() {
    return Object.keys(this.stateList.states);
  }
  get loadedStateName() {
    return this.stateList.loadedStateName;
  }

  get fixtures() {
    return this.context.rootState.universes.universe.fixtures;
  }







}


