import { Module, VuexModule, Mutation, Action, MutationAction } from 'vuex-module-decorators';

import Server from '../../api/Server';
import DMXClient from '../../api/DMXClient';
import { fetchRemote } from '@API/ServerSync';
// const _ = require('lodash')
import { Settable } from '../util';




@Module({namespaced: true})
export default class DMXConfig extends VuexModule {

  public serverIP = Server.__serverIP
  public dmxClientC = DMXClient;
  // @Settable()
  public get __portNameList() {
    // fetchRemote(this.dmxClientC,"portList");
    // debugger
    return this.dmxClientC.__portNameList;
  }
  // @Settable()
  public get __driverNameList() {
    // debugger
    return this.dmxClientC.__driverNameList;
  }
  // @Settable()
  public get selectedPortName() {
    return this.dmxClientC.selectedPortName;
  }
  public set selectedPortName(v: string) {
    this.dmxClientC.selectedPortName = v;
  }
  public get selectedDriverName() {
    return this.dmxClientC.selectedDriverName;
  }
  public set selectedDriverName(v: string) {
    debugger;
    this.dmxClientC.selectedDriverName = v;
  }

  public get dmxIsConnected() {
    // debugger;
    return this.dmxClientC.__connected;
  }
  // @Settable()
  // public selectedDriver = '';

  // public get dmxClientC(){
  //   return DMXClient
  // }

  @Action
  public configureFromObj(ob: any) {

    // this.selectedPort = ob.selectedPort;
    // this.selectedDriver = ob.selectedDriver;

    // this.context.commit('setCurrentStateName', ob.stateName);
  }



  @Action
  public refreshPortList() {
    if (this.isConnected()) {

        fetchRemote(this.dmxClientC, '__portNameList');

    } else {
      console.error('not connected');
    }

  }

  @Action
  public refreshDevicesList() {
    if (this.isConnected()) {
      fetchRemote(this.dmxClientC, '__driverNameList');
    } else {
      console.error('not connected');
    }

  }
  @Action
  public tryConnectPort(pl: string) {
    this.dmxClientC.selectedPortName = pl;
    // this.context.commit('set__selectedPort', pl);
    // this.rootSocket.emit('DMX/SET_PORTNAME', pl, (res: string) => {
    //   this.context.commit('set__selectedPort', res);
    // });
  }
  @Action
  public tryConnectDriver(pl: string) {
    this.dmxClientC.selectedDriverName = pl;
    // this.context.commit('set__selectedDriver', pl);
    // this.rootSocket.emit('DMX/SET_DRIVERNAME', pl);
  }

  @Mutation
  public tryIP(ip:string){
    const oldIP = ip
    if(!Server.changeServerIP(ip)){
      Server.changeServerIP(oldIP)
    }
    else{
      this.serverIP=ip;
    }
  }

  get rootSocket() {
    return Server.getSocket();
  }

  get isConnected() {
    return this.rootSocket.connected;

  }





}




