import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators';



import { Settable } from '../util';

@Module({namespaced: true})
export default class Config extends VuexModule {

  @Settable()
  public autoSave: boolean = true;

  @Action
  public configureFromObj(ob: any) {
    console.log('configure config obj');
    this.context.commit('set__autoSave', ob.autoSave ? true : false);
    // this.selectedPort = ob.selectedPort;
    // this.context.commit('setCurrentStateName', ob.stateName);
  }





}




