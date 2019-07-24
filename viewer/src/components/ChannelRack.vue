<template>
  <div class="ChannelRack">
  <div class="header">
    <!-- <Button @click="addFixture()" text="addFixture"/> -->
    <StateComponent class="StateComponent"></StateComponent>
    <!-- <toggle :showName="true" v-model="showNames" text="showNames" ></toggle> --> 
    <!-- <toggle name="showValues" v-model="showValues" ></toggle>  -->
  </div>
  <slider class="grandMaster" @input="setGrandMaster($event)" :value="grandMaster" name="grandMaster"  showName="1" showValue="1" ></slider>

    <fixture-widget class="channel" v-for="f in universe.fixtures" :key="f.id" :fixtureProp="f" :showName="showNames" :showValue="showValues"></fixture-widget>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import FixtureWidget from './FixtureWidget.vue' ;
import StateComponent from './StateComponent.vue';
import Button from './Button.vue';
import Toggle from './Toggle.vue';
import Slider from './Slider.vue';

import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import { DirectFixture } from '../api/Fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {FixtureWidget, Button, Toggle, StateComponent, Slider},
})
export default class ChannelRack extends Vue {

  @fixturesModule.Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];

  public showNames = false;
  public showValues = true;
  @fixturesModule.State('universe') private universe!: FixtureMethods['universe'];
  @fixturesModule.Getter('grandMaster') private grandMaster!: FixtureMethods['grandMaster'];

  @fixturesModule.Mutation('setGrandMaster') private setGrandMaster!: FixtureMethods['setGrandMaster'];






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
  .grandMaster{
    width:100%;
  }

</style>
