<template>
  <div class="ChannelRack">
  <div class="header">
    <Button @click="addChannel()" text="addChannel"/>
    <StateComponent class="StateComponent"></StateComponent>
    <toggle :showName="true" v-model="showNames" text="showNames" ></toggle> 
    <!-- <toggle name="showValues" v-model="showValues" ></toggle>  -->
  </div>
    <channel-widget class="channel" v-for="f in fixtures" :key="f.id" :fixtureProp="f" :showName="showNames" :showValue="showValues"></channel-widget>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ChannelWidget from './ChannelWidget.vue' ;
import StateComponent from './StateComponent.vue';
import Button from './Button.vue';
import Toggle from './Toggle.vue';

import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import { DirectFixture } from '../api/fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {ChannelWidget, Button, Toggle,StateComponent},
})
export default class ChannelRack extends Vue {

  @fixturesModule.Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];

  public showNames = false;
  public showValues = true;
  @fixturesModule.State('fixtures') private fixtures!: FixtureMethods['fixtures'];



  public addChannel() {
    console.log('add widget');
    const name = 'channel : ' + this.fixtures.length;
    this.addFixture({name, circs: [10]});
    // this.$store.commit('dimmers/addFixture', 'lala');
  }



}
</script>

  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  .ChannelRack {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    background-color: gray;
  }
    .header {
    display: flex;
    width:100%;
    justify-content: space-around;
    align-items: center;
    flex-direction: row;
    background-color: darkgrey;
  }
  .channel{
    width:100%;
  }
  .StateComponent{
    flex: 1 1 30%;
  }

</style>
