
// import {Store} from '../store'
import {UniverseListener} from './Channel';
import _ from 'lodash';
class DMXClient {
  private store: any;
  private socket: any;
  private fromServer = false;
  private boundCB: any;
  private debouncedSaving = _.debounce(() => {
      this.store.dispatch('states/saveCurrentState', {name: 'current' });
    },
    1000);

  constructor() {

  }



  public universeChangedCB(c: number, v: number) {

    if (!this.fromServer && this.socket) {
      // console.log('emitting',c,v)
      this.socket.emit('DMX/SET_CIRC', [{c, v}]);
    }

    this.debouncedSaving();
  }

  public subscribe(socket: any, store: any) {
    this.store = store;
    this.socket = socket;


    socket.on('disconnect', () => {
      // unsubscribe();
      if (this.boundCB) {
        UniverseListener.removeListener('channelChanged', this.boundCB);
      }
    });

    const init =  () => {
      // store.watch(
      //   ()=>{store.})
      if (!this.boundCB) {
        this.boundCB = this.universeChangedCB.bind(this);
        UniverseListener.on('channelChanged', this.boundCB);
      }


      socket.on('DMX/SET_CIRC', ((pl: any[]) => {
        this.fromServer = true;
        const allChannels = store.getters['fixtures/usedChannels'];
        let found = false;
        for ( const cp of pl) {
          const chI = parseInt(cp.c, 10);
          for ( const c of allChannels) {
            if ( c.circ === chI) {
              store.commit('fixtures/setChannelValue', {channel: c, value: cp.v, dontNotify: false});
              found = true;
            }
          }
          if (!found) {console.error('cant set circ', cp, allChannels); }

        }
        this.fromServer = false;
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
      socket.emit('DMX/GET_DRIVERNAME');
      socket.on('DMX/SET_DRIVERNAME', ((pl: any[]) => {
        store.commit('DMXConfig/set__selectedDriver', pl);
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
