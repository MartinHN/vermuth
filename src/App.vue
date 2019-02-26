<template>
  <div id="app">
    
    <div id="nav">
      <div id="saved_status">{{saved_status}}</div> | 
      <router-link to="/">Dashboard</router-link> |
      <router-link to="/PatchView">Patch</router-link> |
      <router-link to="/Config">Config</router-link>
    </div>
    
    <router-view/>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';


import Store from './store';



@Component({
  components: { },
})
export default class App extends Vue {

  // @Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  @State('saved_status') public saved_status!: string;

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
}

#nav a.router-link-exact-active {
  color: #42b983;
}
#saved_status{
  display:inline-block;
  align-content: left;
}
</style>
