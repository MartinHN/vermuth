<template>
  <div class="main">
    ChannelPatch
    <br/>
    <div class="ChannelPatch">
      <div class="patchLine" v-for="f in fixtures" :key="f.id" >
        <input type="text" @change="setChannelName({channel:f.channel,name:$event.srcElement.value})" :value="f.channel.name" ></input>
        <div  v-for="(d,i) in f.dimmer.circs" :key="d.id" >
          <widget type="Number" @value-change="linkChannelToDimmer({channelName:f.channel.name,dimmerNum:$event.value,dimmerIdx:i})" :valuestore="d" />
          <widget v-if="i>0" type="TextButton" :options="{text:'x',size:[10,10]}"  @value-change="$event.value && removeDimmerFromChannel({channelName:f.channel.name,dimmerIdx:i})" />
          </div>
          <br/>
          <widget type="TextButton" :options="{text:'Add'}"  @value-change="$event.value && addChannelToDimmer({channelName:f.channel.name,dimmerNum:0})" />

        </div>
      </div>
    </div>
  </template>

  <script lang="ts">
  import { Component, Prop, Vue } from 'vue-property-decorator';
  import FixtureWidget from './FixtureWidget.vue' ;
  import Widget from './Widget.vue' ;
  import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
  import { DirectFixture } from '../api/fixture';
  import FixtureMethods from '../store/fixtures';


  const fixturesModule = namespace('fixtures');

  @Component({
    components: {fixture: FixtureWidget, Widget},
  })
  export default class ChannelPatch extends Vue {

    @fixturesModule.Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
    @fixturesModule.Mutation('linkChannelToDimmer') public linkChannelToDimmer!: FixtureMethods['linkChannelToDimmer'];
    @fixturesModule.Mutation('addChannelToDimmer') public addChannelToDimmer!: FixtureMethods['addChannelToDimmer'];
    @fixturesModule.Mutation('removeDimmerFromChannel') public removeDimmerFromChannel!: FixtureMethods['removeDimmerFromChannel'];
    @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];


    @fixturesModule.State('fixtures') private fixtures!: FixtureMethods['fixtures'];
    @fixturesModule.Getter('usedChannels') private usedChannels!: FixtureMethods['usedChannels'];

  }


</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ChannelPatch {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
}
.patchLine{
  display: flex;
  justify-content: space-between;
  align-items: center;
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
