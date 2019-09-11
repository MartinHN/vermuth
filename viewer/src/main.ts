import Vue from 'vue';
import './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
// import './registerServiceWorker';

import * as VueMenu from '@hscmap/vue-menu'
Vue.use(VueMenu)

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
