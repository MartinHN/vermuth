import io from 'socket.io-client';
import dmxClient from './DMXClient';
import { bindClientSocket, nonEnumerable } from '@API/ServerSync';
import rootState from '@API/RootState';
import {getCircular} from '@API/SerializeUtils';

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
    this.__store = store;
    const socket = io(`http://${serverIp}:3000`);
    this.__socket = socket;
    store.dispatch('SET_CONNECTED_STATE', 'connecting');

    socket.on('connect', () => {
      bindClientSocket(socket);
      console.log('connected to server');

      store.dispatch('SET_CONNECTED_STATE', 'connected');
      let hasRemoteState = false;
      socket.emit('GET_STATE', 'sessionKey', (state: any) => {
      });

      socket.on('DBG', (msg: any) => {console.error(msg); });
      // const unsubscribe = store.subscribe((mutation: any, state: any) => {
      //   if (hasRemoteState && mutation.type === 'SET_SAVE_STATUS' && mutation.payload === 'Saved') {
      //     socket.emit('SET_STATE', 'session',state);
      //   }
      // });

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

    });

  }
  public getSocket() {
    return this.__socket;
  }





}

const s = new Server();
export default s;
