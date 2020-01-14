// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';

import rootState from '@API/RootState.ts';


import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

import {getCircular} from '@API/SerializeUtils';
@Module({namespaced: true})
export default class RootStateModule extends VuexModule {

  // public root = rootState;
  public hasBeenConfigured = false;

  public FixtureFactory = rootState.fixtureFactory;
  @Action
  public configureFromObj(js: any) {
    this.context.commit('configureFromObjMut', js);
  }
  @Mutation
  public configureFromObjMut(js: any) {
    rootState.configureFromObj(js);
    // getCircular(this.root)
    this.hasBeenConfigured = true;
  }






}


