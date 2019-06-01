
import Vue from 'vue';
import Vuex , { StoreOptions, Store } from 'vuex';
import config from './config';
import fixtures from './fixtures';
import states from './states';
import sequence from './sequence';
import DMXConfig from './DMXConfig';
import _ from 'lodash';
// import {diff} from 'json-diff'
// import createLogger from '../../../src/plugins/logger'
import {RootState, FullState} from './types';
import Server from '../api/Server';
Vue.use(Vuex);

const debug =  process.env.NODE_ENV !== 'production';

const sessionKey = 'content';
const configKey = 'config';



function builEscapedJSON(content: any, indent?: number) {
  function filterPrivate(key: string, value: any) {
    if (key.startsWith('__')) {
      console.log('ignoring', key);
      return undefined;
    } else { return value; }

  }
  return JSON.stringify(content, filterPrivate, indent);
}

function buildEscapedObject(content: any, indent?: number) {
  return JSON.parse(builEscapedJSON(content));
}

const localFS = {
  load(key: string) {
    return new Promise((resolve, reject) => {
      const json = window.localStorage.getItem(key) || JSON.stringify('');
      // const json = JSON.stringify('');
      resolve(JSON.parse(json));
    });
  },

  save: _.debounce((content, key: string, callback: () => void) => {

    window.localStorage.setItem(key, builEscapedJSON(content));
    callback();
  }, 1000, { maxWait: 3000 , leading: false, trailing: true}),


  getSessionFromState(state: any) {
    return {fixtures: state.fixtures, sequence: state.sequence, states: state.states};
  },

  downloadObjectAsJson(exportString: string, exportName: string) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportString);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href',     dataStr);
    downloadAnchorNode.setAttribute('download', exportName + '.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },
};


const serverFS = (socket: any) => {
  return {
    load(key: string) {
      return new Promise((resolve, reject) => {
        socket.emit('GET_STATE', key, (json: any) => {
          debugger;
          resolve(JSON.parse(json));
        });

      });
    },
    save: _.debounce((content, key: string, callback?: () => void ) => {
      socket.emit('SET_STATE', key, buildEscapedObject(content), () => {
        if (callback) {callback(); }
      });
    }, 1000, { maxWait: 3000, leading: true, trailing: false }),
  };
};



const autosaverPlugin = (pStore: Store<RootState>) => {
  pStore.dispatch('LOAD_KEYED_STATE', sessionKey);
  pStore.dispatch('LOAD_KEYED_STATE', configKey);



  pStore.subscribe((mutation, state: any) => {
    state = state as FullState;
    if (mutation.type.startsWith('config')) {
      localFS.save(state.config, configKey, () => {
      });
    } else if (!state.loadingState && (state.savedStatus === 'Saved' || state.savedStatus === '' ) && state.config.autoSave && mutation.type.includes('/') ) {
      pStore.commit('SET_SAVE_STATUS', 'Saving...');
      const ts = localFS.getSessionFromState(state);

      localFS.save(ts, sessionKey, () => {
        if (!state.syncingFromServer) {
         pStore.dispatch('SAVE_REMOTELY', ts);
       }
        pStore.commit('SET_SAVE_STATUS', 'Saved');

     });

      return;
    }

  });
};


const store: StoreOptions<RootState> = {
  modules: {
    config,
    fixtures,
    states,
    DMXConfig,
    sequence,
  },
  state: {
    version: '1.0.0', // a simple property
    savedStatus: '',
    connectedState: 'not Connected',
    connectedId: -1,
    loadingState: false,
    syncingFromServer: false,
  },
  mutations: {

    SET_SAVE_STATUS(s, pl) {
      s.savedStatus = pl;
    },
    SET_CONNECTED_STATE(s, pl) {
      s.connectedState = pl;
    },
    SET_CONNECTED_ID(s, pl) {
      s.connectedId = pl;
    },
    SET_LOADING_STATE(s, pl) {
      s.loadingState = pl;
    },

  },
  actions: {
    LOAD_KEYED_STATE(context, key: string) {
      localFS.load(key)
      .then((newState: any) => {
        if (key === sessionKey) {
          context.dispatch('SET_SESSION_STATE', newState);
        } else if (key === configKey) {
          context.dispatch('SET_CONFIG_STATE', newState);
        }
      })
      .catch((err) => {console.log('can\'t loadState'); });
    },
    SET_SESSION_STATE(context, newState) {
      if (newState) {
        context.commit('SET_LOADING_STATE', true);
        ['fixtures', 'states', 'DMXConfig', 'sequence'].forEach((el) => {
          if (newState[el]) {
            context.dispatch('' + el + '/fromObj', newState[el]);
          }
        });
        context.commit('SET_LOADING_STATE', false);
      }
    },
    UPDATE_SESSION_STATE(context, difObj) {
      // if(difObj){
        // context.commit('SET_LOADING_STATE',true);
        // context.commit('fixtures/fromObj', difObj.fixtures);
        // context.dispatch('states/fromObj', difObj.states);
        // context.dispatch('DMXConfig/fromObj', difObj.states);
        // context.dispatch('sequence/fromObj', difObj.sequence);
        // context.commit('SET_LOADING_STATE',false);
        // }
      },
      SET_CONFIG_STATE(context, newState) {
        if (newState) {
          context.commit('SET_LOADING_STATE', true);
          context.dispatch('config/fromObj', newState);
          context.commit('SET_LOADING_STATE', false);
        }
      },
      SAVE_REMOTELY(context, pl: any) {
        serverFS(context.getters.socket).save(pl, 'session');
      },
      SAVE_LOCALLY(context, pl: any) {
        const newStateString = builEscapedJSON(localFS.getSessionFromState(context.state), 2);
        localFS.downloadObjectAsJson(newStateString, 'state');
      },


    },
    getters: {
      socket() {
        return Server.getSocket();
      },
    },

    strict: debug,
    plugins: [autosaverPlugin],
    // plugins: debug ? [createLogger()] : []
  };


export default new Vuex.Store<RootState>(store);


