import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators';



import { Settable } from '../util';

@Module({namespaced: true})
export default class Config extends VuexModule {



  @Action
  public configureFromObj(ob: any) {
    console.log('configure config obj');
    
    // this.selectedPort = ob.selectedPort;
    // this.context.commit('setCurrentStateName', ob.stateName);
  }





}




