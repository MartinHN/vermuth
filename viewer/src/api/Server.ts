import io from 'socket.io-client';
import dmxServer from './DMX';


class Server {
  private store: any;
  private socket: any;
  constructor() {

  }

  public connect(store: any) {
    this.store = store;
    const socket = io('http://localhost:3000');
    this.socket = socket;
    store.commit('SET_CONNECTED_STATE', 'connecting');

    socket.on('connect', () => {
      console.log('connected to server');

      store.commit('SET_CONNECTED_STATE', 'connected');

      const unsubscribe = store.subscribe((mutation: any, state: any) => {
        if (mutation.type === 'SET_SAVE_STATUS' && mutation.payload === 'Saved') {
          socket.emit('SET_STATE', state);
        }
      });

      socket.on('SET_ID', (msg: number) => {
        store.commit('SET_CONNECTED_ID', msg);
      });

      socket.on('disconnect', () => {
        unsubscribe();
        store.commit('SET_CONNECTED_STATE', 'disconnected');
      });

      socket.emit('GET_ID');

      dmxServer.subscribe(socket, store);

    });

  }
  public getSocket() {
    return this.socket;
  }





}

const s = new Server();
export default s;
