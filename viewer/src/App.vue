<template>
  <v-app id="app">

    <div id="nav">
      
      <router-link to="/Sequencer">Sequencer</router-link>
      <router-link to="/">Dashboard</router-link>
      <router-link to="/Patch">Patch</router-link>
      <router-link to="/Config">Config</router-link>
    </div>
    <ServerState id="serverState"/>
    
    <router-view/>
  </v-app>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Server from './api/Server';
import ServerState from './components/ServerState.vue';

import Store from './store';

let originalFaviconNode: any;
let redFaviconNode: any;

@Component({
  components: { ServerState},
})
export default class App extends Vue {

  // @Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  @State('savedStatus') public savedStatus!: string;

  @Getter('isConnected') public isConnected!: string;

  public mounted() {
    Server.connect(this.$store, window.location.hostname);
    this.removeOldIco();
    originalFaviconNode = this.loadIconNode('favicon.ico');
    redFaviconNode = this.loadIconNode('favicon_red.ico');
    this.changeFavIcon(false);
  }


  @Watch('isConnected')
  public changeFavIcon(value: boolean) {

    const oldLink = document.getElementById('dynamic-favicon');
    const head = document.head || document.getElementsByTagName('head')[0];
    if (oldLink) {
      head.removeChild(oldLink);
    }
    const newLink = value ? originalFaviconNode : redFaviconNode;
    head.appendChild(newLink);




  }

  private removeOldIco() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const links = head.getElementsByTagName('link');
    for ( const l of links) {

    if (l.rel === 'icon' && (l.href.includes('32x32') || l.href.includes('16x16')) ) {
      head.removeChild(l);
    }
   }
  }

  private loadIconNode(src: string) {
    const link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(link);
    return link;
  }




}
</script>
<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: grey;
  min-height: 100%;
  min-width: 100%;
}
#nav {
  padding: 10px;
  display:flex;

  justify-content: space-around;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
  flex:1 1 0;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
#savedStatus{
  flex: 0 0 30px;
  /*display:inline-block;*/
  /*align-content: left;*/
}
#serverState{
  flex:0 0 10px;
}
</style>