// import { Module , MutationTree, GetterTree, ActionTree} from 'vuex';

import rootState from '@API/RootState.ts';


import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';

import {getCircular} from '@API/SerializeUtils';
import {doLocked} from '@API/ServerSync'
@Module({namespaced: true})
export default class RootStateModule extends VuexModule {

  // public root = rootState;
  public hasBeenConfigured = false;

  @Action
  public configureFromObj(js: any) {
    this.context.commit('configureFromObjMut', js);
  }
  @Mutation
  public configureFromObjMut(js: any) {
    // doLocked(()=>{
      rootState.configureFromObj(js)
    // });
    // getCircular(this.root)
    this.hasBeenConfigured = true;
  }






}


