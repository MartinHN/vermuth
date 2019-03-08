<template>
  <div class="main">
    ChannelPatch
    <br/>
    <div class="ChannelPatch">
      <Button class="button addFixture" @click="addFixture()" text="add Fixture"/>
      <div class="patchLine" v-for="f in fixtures" :key="f.id" >
        <div class="fixtureName">
          <input :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
        <Button class="button removeFixture " @click="removeFixture({fixture:f})" tabIndex="-1" text="-"/>
      </div>
        
        <div class="channelLine" v-for="c in f.channels" :key="c.id" >

          <input type="text" class="channelName " @change="setChannelName({channel:c,name:$event.target.value})" :value="c.name"  ></input>
          <div class="dimmers">
            <div v-for="(d,i) in c.dimmers" :key="d.id" class=" dimmerCell" >
              <Numbox class="dimmerNum" :value="d.circ" :min="0" :max="255" @input="linkChannelToDimmer({channel: c, dimmerNum: $event.value, dimmerIdx: i})" ></Numbox>
              <Button class="button removeDimmer " v-if="c.dimmers.length>1" @click="removeDimmerFromChannel({channel:c,dimmerIdx:i})" tabIndex="-1" text=""></Button>
            </div>
          </div>
          <Button class="addDimmer" @click="addDimmerToChannel({channel:c,dimmerNum:0})" tabIndex="-1" text="+"/>
        </div>


      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';


import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from './Button.vue';
import Numbox from './Numbox.vue';
import { DirectFixture } from '../api/Fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Button, Numbox},
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
  @fixturesModule.Mutation('setFixtureName') public setFixtureName!: FixtureMethods['setFixtureName'];

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
  width: 95%;
  margin:20px;
  /*height:100px;*/
  display: block;
  justify-content: space-between;
  align-items: center;

}
.removeFixture{
  display:inline-block;
  margin-right:10%;
  background-color: red;

}
.fixtureName{
  display:flex;
  flex-direction: row;
  justify-content: space-between;
  width:100%;
  background-color: darkgray;
}

.fixtureName input{

}


.channelLine{
  display:flex;
  flex-direction:row;
  margin-left:30px;
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
  width:10px;
  flex:0 0 10px;
}
.removeDimmer{
  left:0;
  background-color: red;
  height:10px;
  width:10px;

}
</style>
