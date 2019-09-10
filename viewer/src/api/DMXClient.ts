'use-strict';
// import {Store} from '../store'

import { DMXControllerI } from '@API/DMXControllerI';
import {AccessibleClass, nonEnumerable, RemoteValue, RemoteFunction, fetchRemote} from '@API/ServerSync';
import { getCircular} from '@API/SerializeUtils';
import _ from 'lodash';
import { addProp } from '@API/MemoryUtils';
// @AccessibleClass()
// class FakeDMXClient implements DMXControllerI {
//   @RemoteValue()
//   public portName ="none";

//   public portList:string[] = [];

//   public driverName:string = "none";

//   public driverList:string[] = [];

//   public connected:boolean = false;

//   setCircs(msg: Array<{c: number, v: number}>, fromSocket:any){};
//   connectToDevice(cb: (msg: string) => void, options:any){};
//   public subscribe(socket: any, store: any) {}
// }
@AccessibleClass()
class DMXClient implements DMXControllerI {


  @RemoteValue()
  public selectedPortName = 'none';
  @RemoteValue()
  public __portNameList: string[] = [];
  @RemoteValue()
  public selectedDriverName: string = 'none';
  @RemoteValue()
  public __driverNameList: string[] = [];
  @RemoteValue()
  public __connected: boolean = false;

  @nonEnumerable()
  private __store: any;
  @nonEnumerable()
  private __socket: any;

  @nonEnumerable()
  private fromServer = false;
  @nonEnumerable()
  private boundCB: any;


  private debouncedSaving = _.debounce(() => {
      this.__store.commit('states/saveCurrentState', {name: 'current' });
    },
    1000);

  constructor() {

  }

  @RemoteFunction()
  public setCircs(msg: Array<{c: number, v: number}>, fromSocket: any) {}
  @RemoteFunction()
  public connectToDevice(cb: (msg: string) => void, options: any) {}
  public configureFromObj(o: any) {
    // debugger
    for (const k in this) {
      if (o[k]) {
        this[k] = o[k];
      }
    }
  }



  public universeChangedCB(c: number, v: number) {

    // if (!this.fromServer && this.__socket) {
      // console.log('emitting',c,v)
      // this.setCircs([{c,v}],undefined)
      // this.socket.emit('DMX/SET_CIRC', [{c, v}]);
      // this.debouncedSaving();
    // }


  }

  public subscribe(socket: any, store: any) {
    this.__store = store;

    this.__socket = socket;


    socket.on('disconnect', () => {
      // unsubscribe();

    });

    const init =  () => {
      // store.watch(
      //   ()=>{store.})


      fetchRemote(this, '__portNameList');
      fetchRemote(this, '__driverNameList');
      fetchRemote(this, 'selectedDriverName');
      fetchRemote(this, 'selectedPortName');
      fetchRemote(this, '__connected');


    };
    if (socket.connected) {init(); } else {socket.on('connect', init()); }

  }





}

const s = new DMXClient();
// getCircular(s)
export default s;
