
import Vue from 'vue';
import Vuex , { StoreOptions, Store } from 'vuex';
import config from './config';
import fixtures from './fixtures';
import states from './states';
import sequence from './sequence';
import DMXConfig from './DMXConfig';
import _ from 'lodash';

// import createLogger from '../../../src/plugins/logger'
import {RootState,FullState} from './types';
import Server from '../api/Server';
Vue.use(Vuex);

const debug =  process.env.NODE_ENV !== 'production';

const sessionKey = 'content';
const configKey = 'config';

function buildEscapedObject(content:any,indent?:number){


  function filterPrivate(key:string,value:any)
  {
    if (key.startsWith("__")){
      console.log('ignoring',key);
      return undefined;
    }
    else return value;
  }
  return JSON.stringify(content,filterPrivate,indent)
}

const api = {
  load(key:string) {
    const json = window.localStorage.getItem(key) || JSON.stringify('');
    return JSON.parse(json);
  },
  save: _.debounce((content, key:string, callback) => {
    window.localStorage.setItem(key, buildEscapedObject(content));
    callback();
  }, 1000, { maxWait: 3000 }),
  getSessionFromState(state:any){
    return {fixtures:state.fixtures,sequence:state.sequence,states:state.states}
  },
  downloadObjectAsJson(exportString:string, exportName:string){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportString);
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }


};


const autosaverPlugin = (pStore: Store<RootState>) => {
  pStore.dispatch('LOAD_GLOBAL_STATE',sessionKey);
  pStore.dispatch('LOAD_GLOBAL_STATE',configKey);



  pStore.subscribe((mutation, state:any) => {
    state = state as FullState
    if(mutation.type.startsWith('config')){
      api.save(state.config,configKey, () => {
      });
    }
    else if (state.config.autoSave && mutation.type.includes('/') ) {
      pStore.commit('SET_SAVE_STATUS', 'Saving...');
      const ts = api.getSessionFromState(state)

      api.save(ts,sessionKey, () => {
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
    }
  },
  actions: {
    LOAD_GLOBAL_STATE(context: any, key: any) {
      // this.$store.replaceState(newState)
      // this._vm.set(state, 'fixtures', newState.fixtures)

      if (key) {
        const newState = api.load(key)
        if(newState){
          if(key===sessionKey){
            context.commit('fixtures/fromObj', newState.fixtures);
            context.dispatch('states/fromObj', newState.states);
            context.dispatch('DMXConfig/fromObj', newState.states);
            context.dispatch('sequence/fromObj', newState.sequence);
          }
          else if (key===configKey){
           context.dispatch('config/fromObj', newState); 
         }
         else{
          debugger
        }
      }
    }
    // state.fixtures= {...state.fixtures,...newState.fixtures}
    // Object.assign(state.states, newState.states)
  },
  SAVE_LOCALLY(context:any,pl:any){
    const newStateString = buildEscapedObject(api.getSessionFromState(context.state),2)
    api.downloadObjectAsJson(newStateString,'state')
 }
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


