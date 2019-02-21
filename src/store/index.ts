
import Vue from 'vue';
import Vuex , { StoreOptions } from 'vuex';
import fixtures from './fixtures';
// import createLogger from '../../../src/plugins/logger'
import {RootState} from './types';

Vue.use(Vuex);

const debug =  process.env.NODE_ENV !== 'production';


const store: StoreOptions<RootState> = {
  modules: {
    fixtures,

  },
  state: {
        version: '1.0.0', // a simple property
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : []
};


export default new Vuex.Store<RootState>(store);


