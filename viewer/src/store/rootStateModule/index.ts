// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';

import rootState from '@API/RootState.ts';


import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

@Module({namespaced: true})
export default class RootStateModule extends VuexModule {

  public root = rootState;
  public hasBeenConfigured = false;

  @Action
  public configureFromObj(js: any) {
    this.context.commit('configureFromObjMut', js);
  }
  @Mutation
  public configureFromObjMut(js: any) {
    this.root.configureFromObj(js);
    this.hasBeenConfigured = true;
  }






}


