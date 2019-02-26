<template>
  <div class="config">


  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';

import { DirectFixture } from '../api/fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: { },
})
export default class FixtureRack extends Vue {

  // @fixturesModule.Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  // @fixturesModule.State('fixtures') private fixtures!: FixtureMethods['fixtures'];





}


// const cusd: DirectiveOptions ={
  //   inserted: function (el, binding, vnode) {
    //     console.log('My Element is:', vnode.elm);
    //     console.log('My componentInstance is:', vnode.componentInstance);
    //     console.log('My Vue Instance is:', vnode.context);
    //   }
    // }
</script>

  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  .rack {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: gray;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    display: inline-block;
    margin: 0 10px;
  }
  a {
    color: #42b983;
  }
</style>
