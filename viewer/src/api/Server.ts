import io from 'socket.io-client';
import dmxClient from './DMXClient';
import { bindClientSocket, nonEnumerable, doSharedFunction } from '@API/ServerSync';
import rootState from '@API/RootState';
import { getCircular } from '@API/SerializeUtils';


let hasRemoteState = false;

class Server {
  @nonEnumerable()
  public __serverIP: string = '';
  @nonEnumerable()
  private __store: any;
  @nonEnumerable()
  private __socket: any;
  constructor() {
    rootState.registerDMXController(dmxClient);

    // getCircular(dmxServer)

  }

  public connect(store: any, serverIP: string) {
    this.__serverIP = serverIP;
    this.__store = store;
    const pagePort =  parseInt(window.location.port)
    const IOPort = pagePort >8000?3005 : pagePort;
    console.warn('try to connect sockIO to',`http://${serverIP}:${IOPort}`)
    const socket = io(`http://${serverIP}:${IOPort}`, { transports: ['websocket'] });
    //@ts-ignore
    const originFunc = socket.io.engine.transport.write
    // hack : bypass useless socketio timeOut to ensure fast WS re-sends < 10ms  instead of 200ms ;)
    //@ts-ignore
    const newFunc = function (packets) {
      //@ts-ignore
      const self = this as any
      //@ts-ignore
      originFunc.call(this, packets)
      //@ts-ignore
      socket.io.engine.prevBufferLen = packets.length;

      self.emit('drain');
      self.writable = true;

    }
    //@ts-ignore
    socket.io.engine.transport.write = newFunc
    if (this.__socket && (this.__socket === socket)) {
      console.error('reassigning to same socket');
      return false;
    }
    this.__socket = socket;
    store.dispatch('SET_CONNECTED_STATE', 'connecting');



    socket.on('connect', () => {
      console.log('connected to server');
      store.dispatch('SET_CONNECTED_STATE', 'connected');
      rootState.init();


    });


    socket.on('DBG', (msg: any) => { console.error(msg); });


    socket.on('SET_ID', (msg: number) => {
      store.commit('SET_CONNECTED_ID', msg);
    });


    socket.on('SET_STATE', (msg: any) => {
      doSharedFunction(() => {
        store.dispatch('SET_SESSION_STATE', msg).then(() => {
          hasRemoteState = true;
        },
        );
      });
    });
    socket.on('UPDATE_STATE', (msg: any) => {
      doSharedFunction(() => {
        store.dispatch('UPDATE_SESSION_STATE', msg);
      });
    });
    socket.on('disconnect', () => {
      // unsubscribe();
      store.dispatch('SET_CONNECTED_STATE', 'disconnected');
    });

    // socket.once('connect', initF);
    // const initF = () => {
    bindClientSocket(socket);
    // socket.emit('GET_ID');
    dmxClient.subscribe(socket, store);

    // };
    return true;


  }

  public changeServerIP(serverIP: string) {
    if (!this.__store) {
      console.error('store not registered');
      return false;
    } else {
      console.log(`setting server ip to ${serverIP}`);
      return this.connect(this.__store, serverIP);
    }


  }
  public getSocket() {
    return this.__socket;
  }





}

const s = new Server();
export default s;
