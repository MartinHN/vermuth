
import Vue from 'vue';
import Vuex , { StoreOptions, Store } from 'vuex';
import fixtures from './fixtures';
import states from './states';
import _ from 'lodash';

// import createLogger from '../../../src/plugins/logger'
import {RootState} from './types';

Vue.use(Vuex);

const debug =  process.env.NODE_ENV !== 'production';

const storageKey = 'content';
const api = {
  load() {
    const json = window.localStorage.getItem(storageKey) || JSON.stringify('');
    return JSON.parse(json);
  },
  save: _.debounce((content, callback) => {
    window.localStorage.setItem(storageKey, JSON.stringify(content));
    callback();
  }, 1000, { maxWait: 3000 }),
};


const autosaverPlugin = (pStore: Store<RootState>) => {
  pStore.dispatch('LOAD_GLOBAL_STATE', api.load());

  pStore.subscribe((mutation, state) => {
    if (mutation.type.includes('/') ) {
      pStore.commit('SET_SAVE_STATUS', 'Saving...');

      api.save(state, () => {
        pStore.commit('SET_SAVE_STATUS', 'Saved');
      });

      return;
    }
  });
};


const store: StoreOptions<RootState> = {
  modules: {
    fixtures,
    states,

  },
  state: {
        version: '1.0.0', // a simple property
        savedStatus: '',
  },
  mutations: {

    SET_SAVE_STATUS(s, pl) {
      s.savedStatus = pl;
    },
  },
  actions: {
    LOAD_GLOBAL_STATE(context: any, newState: any) {
      // this.$store.replaceState(newState)
      // this._vm.set(state, 'fixtures', newState.fixtures)
      if (newState) {
      context.commit('fixtures/fromObj', newState.fixtures);
      context.dispatch('states/fromObj', newState.states);
    }
      // state.fixtures= {...state.fixtures,...newState.fixtures}
      // Object.assign(state.states, newState.states)
    },
  },

  strict: debug,
  plugins: [autosaverPlugin],
  // plugins: debug ? [createLogger()] : []
};


export default new Vuex.Store<RootState>(store);


