<template>
  <v-app id="app">
    
    <div id="nav">
      <ServerState id="serverState"/>
      <router-link to="/Sequencer">Sequencer</router-link>
      <router-link to="/">Dashboard</router-link>
      <router-link to="/Patch">Patch</router-link>
      <router-link to="/Config">Config</router-link>
    </div>
    
    <router-view/>
  </v-app>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Server from './api/Server';
import ServerState from './components/ServerState.vue';

import Store from './store';



@Component({
  components: { ServerState},
})
export default class App extends Vue {

  // @Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  @State('savedStatus') public savedStatus!: string;
  public mounted() {
    Server.connect(this.$store, window.location.hostname);
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