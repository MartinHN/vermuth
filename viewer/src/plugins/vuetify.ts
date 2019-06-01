import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import './vuetify.styl';

Vue.use(Vuetify, {
  iconfont: 'md',
    theme:   {
    primary: '#ffc107',
    secondary: '#607d8b',
    accent: '#ff5722',
    error: '#f44336',
    warning: '#ff9800',
    info: '#9c27b0',
    success: '#4caf50',
  },
});
