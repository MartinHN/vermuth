import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators';

// import Server from '../../api/Server';
// const _ = require('lodash')
import { Settable } from '../util';

@Module({namespaced: true})

export default class Config extends VuexModule {
  // public dState: DimmerState;
  @Settable()
  public autoSave: boolean = false;

  @Action
  public fromObj(ob: any) {
    this.context.commit('set__autoSave', ob.autoSave ? true : false);
    // this.selectedPort = ob.selectedPort;
    // this.context.commit('setCurrentStateName', ob.stateName);
  }





}




