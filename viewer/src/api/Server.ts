import io from 'socket.io-client';
import dmxClient from './DMXClient';
import { bindClientSocket, nonEnumerable } from '@API/ServerSync';
import rootState from '@API/RootState';
import {getCircular} from '@API/SerializeUtils';

let __serverListenerInited = false;
let hasRemoteState = false;

class Server {
  @nonEnumerable()
  private __store: any;
  @nonEnumerable()
  private __socket: any;
  constructor() {
    rootState.registerDMXController(dmxClient);
    // getCircular(dmxServer)

  }

  public connect(store: any, serverIp: string) {
    if (__serverListenerInited) {
      console.error('double call to connect Sever on client');
    }
    this.__store = store;
    const socket = io(`http://${serverIp}:3000`);
    this.__socket = socket;
    store.dispatch('SET_CONNECTED_STATE', 'connecting');


    const initF = () => {
      __serverListenerInited = true;
      bindClientSocket(socket);


      socket.on('DBG', (msg: any) => {console.error(msg); });


      socket.on('SET_ID', (msg: number) => {
        store.commit('SET_CONNECTED_ID', msg);
      });


      socket.on('SET_STATE', (msg: any) => {
        store.dispatch('SET_SESSION_STATE', msg).then(() => {
          hasRemoteState = true;
        },
        );
      });
      socket.on('UPDATE_STATE', (msg: any) => {
        store.dispatch('UPDATE_SESSION_STATE', msg);
      });
      socket.on('disconnect', () => {
        // unsubscribe();
        store.dispatch('SET_CONNECTED_STATE', 'disconnected');
      });

      socket.emit('GET_ID');

      dmxClient.subscribe(socket, store);

    };

    socket.on('connect', () => {
      console.log('connected to server');
      store.dispatch('SET_CONNECTED_STATE', 'connected');
      socket.emit('GET_STATE', 'sessionKey', (state: any) => {});

    });
    socket.once('connect', initF);

  }
  public getSocket() {
    return this.__socket;
  }





}

const s = new Server();
export default s;
