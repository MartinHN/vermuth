import Vue from 'vue';
import Router from 'vue-router';
import DashBoard from './views/DashBoard.vue';
import PatchView from './views/PatchView.vue';
import GroupView from './views/GroupView.vue';
import Config from './views/Config.vue';
import SequencerView from './views/SequencerView.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
  {
    path: '/',
    name: 'DashBoard',
    component: DashBoard,
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
  },
  {
    path: '/Sequencer',
    name: 'Sequencer',
    component: SequencerView,
  },

  {
    path: '/Patch',
    name: 'Patch',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: () => import(/* webpackChunkName: "PatchViewCh" */ './views/PatchView.vue'),
    component: PatchView,
  },
  ],
});
