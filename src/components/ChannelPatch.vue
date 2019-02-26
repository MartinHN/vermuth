<template>
  <div class="main">
    ChannelPatch
    <br/>
    <div class="ChannelPatch">
      <Button class="button addFixture" @click="addFixture()" text="add Channel"/>
      <div class="patchLine" v-for="f in fixtures" :key="f.id" >
         <Button class="button removeChannel " 
            @click="removeFixture({channelName:f.channel.name})" tabIndex="-1" text=""/>
        <input type="text" class="channelName " @change="setChannelName({channel:f.channel,name:$event.target.value})" :value="f.channel.name"  ></input>
        <div class="dimmers">
        <div  v-for="(d,i) in f.dimmers" :key="d.id" class=" dimmerCell" >
          <Numbox class="dimmerNum" :value="d.circ" :min="0" :max="255"
          @input="linkChannelToDimmer({channelName: f.channel.name, dimmerNum: $event.value, dimmerIdx: i})" />

          <Button class="button removeDimmer " v-if="f.dimmers.length>1"
            @click="removeDimmerFromChannel({channelName:f.channel.name,dimmerIdx:i})" tabIndex="-1" text=""/>
        </div>
      </div>
        
        <Button class="addDimmer" @click="addDimmerToChannel({channelName:f.channel.name,dimmerNum:0})" tabIndex="-1">+</Button>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';


import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from './Button.vue'
import Numbox from './Numbox.vue'
import { DirectFixture } from '../api/fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Button,Numbox},
})
export default class ChannelPatch extends Vue {

  @fixturesModule.Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  @fixturesModule.Mutation('linkChannelToDimmer') public linkChannelToDimmer!: FixtureMethods['linkChannelToDimmer'];
  @fixturesModule.Mutation('addDimmerToChannel') public addDimmerToChannel!: FixtureMethods['addDimmerToChannel'];
  @fixturesModule.Mutation('removeDimmerFromChannel') public removeDimmerFromChannel!: FixtureMethods['removeDimmerFromChannel'];
  @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];

  @fixturesModule.Mutation('removeFixture') public removeFixture!: FixtureMethods['removeFixture'];

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
  width: 100%;
  margin:20px;
  /*height:100px;*/
  display: flex;
  justify-content: space-between;
  align-items: center;
  
}


.dimmerNum{
  /*width: 30px;*/
  font-size: x-large;
}

.channelName{
  left: 0;
  flex:0 0 30%;
  font-size: x-large;
  /*display: None;*/
}
.dimmers{
  flex:1 1 60%;
  display:flex;
  flex-wrap: wrap;
}
.dimmerCell{
  flex:1 1 10%;
  display: -webkit-inline-box;
  /*flex-direction:row;*/
  justify-content: space-around;
  /*align-content: center;*/
  align-items: center;
}

.removeChannel{
  background-color: red;
}
.addDimmer{
  background-color: green;
  height:10px;
  flex:0 0 10px;
}
.removeDimmer{
  left:0;
  background-color: red;
  height:10px;
  width:10px;

}
</style>
