
import Vue from 'vue';
import Vuex , { StoreOptions, Store } from 'vuex';
import config from './config';
import universes from './universes';
import states from './states';
import sequence from './sequence';
import rootStateModule from './rootStateModule';
import DMXConfig from './DMXConfig';
import { buildEscapedJSON, buildEscapedObject } from '@API/SerializeUtils';
import { downloadObjectAsJSON } from './util';
import _ from 'lodash';
// import {diff} from 'json-diff'
// import createLogger from '../../../src/plugins/logger'
import {FullVueState, RootVueState} from './types';
import rootState from '@API/RootState';
import Server from '../api/Server';
Vue.use(Vuex);

const debug =  process.env.NODE_ENV !== 'production';

const sessionKey = 'content';
const configKey = 'config';



function   getSessionObject() {
  return rootState;
}

const serverIsConnected = () => {
  return Server.getSocket() && Server.getSocket().connected;
};


const localFS = {
  load(key: string) {
    return new Promise((resolve, reject) => {
      const json = window.localStorage.getItem(key) || JSON.stringify('');
      // const json = JSON.stringify('');
      resolve(JSON.parse(json));
    });
  },

  save: _.debounce((content, key: string, callback: () => void) => {

    window.localStorage.setItem(key, buildEscapedJSON(content));
    callback();
  }, 1000, { maxWait: 3000 , leading: false, trailing: true}),

};



const serverFS = () => {
  const socket = Server.getSocket();
  return {
    load(key: string) {

      return new Promise((resolve, reject) => {
        socket.emit('GET_STATE', key, (json: any) => {
          resolve(json);

        });

      });
    },
    save: _.debounce((content, key: string, callback?: () => void ) => {
      if (socket) {
        socket.emit('SET_STATE', key, buildEscapedObject(content), () => {
          if (callback) {callback(); }

        });
      } else {
        // if (callback) {callback("error no socket")}
      }
    }, 1000, { maxWait: 3000, leading: true, trailing: false }),
  };
};



const autosaverPlugin = (pStore: Store<RootVueState>) => {
  pStore.dispatch('LOAD_KEYED_STATE', sessionKey);
  pStore.dispatch('LOAD_KEYED_STATE', configKey);



  pStore.subscribe((mutation, state: any ) => {
    state = state as FullVueState;
    if (mutation.type.startsWith('config')) {
      localFS.save(state.config, configKey, () => {});
    } else if (!state.loadingState && (state.savedStatus === 'Saved' || state.savedStatus === '' ) && state.config.autoSave && mutation.type.includes('/') ) {
      if ( mutation.type.endsWith('Value') ) {
        // console.log('ignoring value changes ' + mutation);
        return;
      }


      const sessionState = getSessionObject();
      if (!sessionState.isConfigured) {
        console.error('trying to save before 1rst configure');
        // debugger
        return;
      }
      pStore.dispatch('SAVE_SESSION');

      return;
    }

  });
};


const store: StoreOptions<RootVueState> = {
  modules: {
    config,
    DMXConfig,
    rootStateModule,
    universes,
    states,
    sequence,
  },
  state: {
    version: '1.0.0',
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

    SET_CONNECTED_ID(s, pl) {
      s.connectedId = pl;
    },
    SET_LOADING_STATE(s, pl) {
      s.loadingState = pl;
    },
    __SET_CONNECTED_STATE(s, pl) {
      s.connectedState = pl;
    },

  },
  actions: {
    SET_CONNECTED_STATE(context, pl) {
      context.commit('__SET_CONNECTED_STATE', pl);
      if (serverIsConnected()) {
        context.dispatch('LOAD_KEYED_STATE', sessionKey);
      }
    },
    LOAD_KEYED_STATE(context, key: string) {
      let loadFS = localFS.load;

      if (serverIsConnected() || key === configKey) {
        if (key === sessionKey) {loadFS = serverFS().load; }
        // debugger
        // localFS.load(key)
        loadFS(key)
        .then((newState: any) => {
          if (key === sessionKey) {
            context.dispatch('SET_SESSION_STATE', newState);
          } else if (key === configKey) {
            context.dispatch('SET_CONFIG_STATE', newState);
          }
        })
        .catch((err) => {
          debugger;
          console.log('can\'t loadState', err);
        });
      }
    },
    SET_SESSION_STATE(context, newState) {
      if (newState) {
        context.commit('SET_LOADING_STATE', true);
        context.dispatch('rootStateModule/configureFromObj', newState);

        context.commit('SET_LOADING_STATE', false);
      }
    },
    UPDATE_SESSION_STATE(context, difObj) {

    },
    SET_CONFIG_STATE(context, newState) {
      if (newState) {
        context.commit('SET_LOADING_STATE', true);
        context.dispatch('config/configureFromObj', newState);
        context.commit('SET_LOADING_STATE', false);
      }
    },
    SAVE_REMOTELY(context, pl: any) {
      serverFS().save(pl, 'session');
    },
    SAVE_LOCALLY(context, pl: any) {
      const newStateString = buildEscapedJSON(getSessionObject(), 2);
      downloadObjectAsJSON(newStateString, 'state');
    },
    SAVE_SESSION(context) {
      const sessionState = getSessionObject();
      context.commit('SET_SAVE_STATUS', 'Saving...');
      localFS.save(sessionState, sessionKey, () => {
        if (!context.state.loadingState ) {
          context.dispatch('SAVE_REMOTELY', sessionState);
        }
        context.commit('SET_SAVE_STATUS', 'Saved');

      });
    },


  },
  getters: {

    isConnected(state, getters) {
      return state.connectedState === 'connected';
    },
  },

  strict: false,
  plugins: [autosaverPlugin],
  // plugins: debug ? [createLogger()] : []
};


export default new Vuex.Store<RootVueState>(store);


