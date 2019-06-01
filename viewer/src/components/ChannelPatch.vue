<template>
  <div class="main">
    ChannelPatch
    <br/>
    <v-container class="ChannelPatch" fluid>
      <v-layout justify-space-around align-center row >
        <v-flex xs9 >
          <Button class="button" @click="addFixture()" text="add Fixture"/>
        </v-flex>
      </v-layout>
      <div  v-for="f in fixtures" :key="f.id" >
        <v-layout justify-space-between align-center row >

          <v-flex xs11 >
            <input :style="{'background-color':'#0003',width:'100%'}" :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
          </v-flex>
          <v-flex xs1 >
            <Button class="button removeFixture " color='red' @click="removeFixture({fixture:f})" tabIndex="-1" text="x"/>
          </v-flex>
          <v-flex xs1 >
          <Button class="button addChannel" color='green' @click="addChannelToFixture({fixture:f})" text="+ Channel"/>
        </v-flex>

        </v-layout>

        <div class="channelLine" v-for="c in f.channels" :key="c.id" >
          <v-layout  justify-space-between align-center row wrap>
            <v-flex xs4>
              <v-layout  align-center row >
                <v-flex xs1 >
                </v-flex>
                <v-flex xs1 >
                  <Button class="button removeChannel " color='red'  @click="removeChannel({channel:c,fixture:f})" tabIndex="-1" text=""></Button>
                </v-flex>
                <v-flex xs11>
                  <input type="text" :style="{'background-color':'#0003',width:'100%'}" class="channelName " @change="setChannelName({channel:c,name:$event.target.value})" :value="c.name"  >
                </v-flex>

              </v-layout>
            </v-flex>
            
            <v-flex xs6>
              <v-layout justify-start align-center row wrap>
                <div v-for="(d,i)  in c.dimmers" :key="d.id" class=" dimmerCell" >
                  <v-flex xs3 >
                    <div :style="{  display:'flex' ,padding:'10px'}">
                      <Button class="button removeDimmer " color='red' v-if="c.dimmers.length>1" @click="removeDimmerFromChannel({channel:c,dimmerIdx:i})" tabIndex="-1" text=""></Button>
                      <Numbox class="dimmerNum" :value="d.circ" :min="0" :max="255" @input="linkChannelToDimmer({channel: c, dimmerNum: $event.value, dimmerIdx: i})" ></Numbox>
                      
                    </div>
                  </v-flex>

                </div>

              </v-layout>
            </v-flex>
            <v-flex xs1>
              <Button class="addDimmer" color='green' @click="addDimmerToChannel({channel:c,dimmerNum:0})" tabIndex="-1" text="+"/>
            </v-flex>
          </v-layout>
        </div>
        

      </div>

    </v-container>
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
  @fixturesModule.Mutation('addChannelToFixture') public addChannelToFixture!: FixtureMethods['addChannelToFixture'];

  @fixturesModule.Mutation('linkChannelToDimmer') public linkChannelToDimmer!: FixtureMethods['linkChannelToDimmer'];
  @fixturesModule.Mutation('addDimmerToChannel') public addDimmerToChannel!: FixtureMethods['addDimmerToChannel'];
  @fixturesModule.Mutation('removeDimmerFromChannel') public removeDimmerFromChannel!: FixtureMethods['removeDimmerFromChannel'];
  @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];
  @fixturesModule.Mutation('removeChannel') public removeChannel!: FixtureMethods['removeChannel'];

  @fixturesModule.Mutation('removeFixture') public removeFixture!: FixtureMethods['removeFixture'];
  @fixturesModule.Mutation('setFixtureName') public setFixtureName!: FixtureMethods['setFixtureName'];

  @fixturesModule.State('fixtures') private fixtures!: FixtureMethods['fixtures'];
  @fixturesModule.Getter('usedChannels') private usedChannels!: FixtureMethods['usedChannels'];

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>

</style>
