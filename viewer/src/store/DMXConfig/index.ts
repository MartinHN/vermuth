import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators';

import Server from '../../api/Server';
// const _ = require('lodash')
import { Settable } from '../util';

@Module({namespaced: true})

export default class DMXConfig extends VuexModule {
  // public dState: DimmerState;
  @Settable()
  public portlist = new  Array<any>();
  @Settable()
  public driverlist = new  Array<any>();
  @Settable()
  public selectedPort = '';
  @Settable()
  public selectedDriver = '';

  @Settable()
  public dmxIsConnected = false;

  @Action
  public fromObj(ob: any) {
    // this.selectedPort = ob.selectedPort;
    // this.context.commit('setCurrentStateName', ob.stateName);
  }



  @Action
  public refreshPortList() {
    if (this.isConnected()) {
      this.rootSocket.emit('DMX/GET_PORTLIST', (pl: any[]) => {
        this.portlist = pl;
      });
    } else {
      console.error('not connected');
    }

  }

  @Action
  public refreshDevicesList() {
    if (this.isConnected()) {
      this.rootSocket.emit('DMX/GET_DRIVERLIST', (pl: any[]) => {
        this.driverlist = pl;
      });
    } else {
      console.error('not connected');
    }

  }
  @Action
  public tryConnectPort(pl: string) {
    this.context.commit('set__selectedPort', pl);
    this.rootSocket.emit('DMX/SET_PORTNAME', pl, (res: string) => {
      this.context.commit('set__selectedPort', res);
    });
  }
  @Action
  public tryConnectDriver(pl: string) {
    this.context.commit('set__selectedDriver', pl);
    this.rootSocket.emit('DMX/SET_DRIVERNAME', pl);
  }

  get rootSocket() {
    return Server.getSocket();
  }

  get isConnected() {
    return this.rootSocket.connected;

  }





}




