
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loade
import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  // theme: {
  //   // dark: true,
  // },

  iconfont: 'mdi',
  theme: {
    dark: true,
    // primary: '#ffc107',
    // secondary: '#607d8b',
    // accent: '#ff5722',
    // error: '#f44336',
    // warning: '#ff9800',
    // info: '#9c27b0',
    // success: '#4caf50',
  }


});
