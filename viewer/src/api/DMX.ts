
// import {Store} from '../store'
import {UniverseListener} from './Dimmer';
class DMXClient {
  private store: any;
  private socket: any;

  constructor() {

  }

  public subscribe(socket: any, store: any) {
    this.store = store;
    this.socket = socket;

    socket.on('disconnect', () => {
      // unsubscribe();
      UniverseListener.setListener((c: number, v: number) => {});
    });

    const init =  () => {
      // store.watch(
      //   ()=>{store.})
      UniverseListener.setListener((c: number, v: number) => {
        socket.emit('DMX/SET_CIRC', [{c, v}]);
      });
      socket.on('DMX/SET_CIRC', ((pl: any[]) => {
        const allChannels = store.getters['fixtures/usedChannels'];
        let found = false;
        for ( const cp of pl) {
          for ( const i of allDimmers) {
            if ( i.circ === parseInt(cp.c, 10)) {
              store.commit('fixtures/setChannelValue', {channel:c, value:cp.v/255});
              found = true;
            }
          }
          if (!found) {console.error('cant set circ', cp, allDimmers); }
        }
    }));

      socket.emit('DMX/GET_PORTLIST');
      socket.on('DMX/SET_PORTLIST', ((pl: any[]) => {
        store.commit('DMXConfig/set__portlist', pl);
      }));

      socket.emit('DMX/GET_ISCONNECTED');
      socket.on('DMX/SET_ISCONNECTED', ((pl: boolean) => {
        store.commit('DMXConfig/set__dmxIsConnected', pl);
      }));

      socket.emit('DMX/GET_DRIVERLIST');
      socket.on('DMX/SET_DRIVERLIST', ((pl: any[]) => {
        store.commit('DMXConfig/set__driverlist', pl);
      }));

      socket.emit('DMX/GET_PORTNAME');
      socket.on('DMX/SET_PORTNAME', ((pl: any[]) => {
        store.commit('DMXConfig/set__selectedPort', pl);
      }));
    };
    if (socket.connected) {init(); } else {socket.on('connect', init()); }

  }





}

const s = new DMXClient();
export default s;
