<template>
  <div class="main">
    ChannelPatch
    <br/>
    <v-container class="ChannelPatch" fluid>
      <v-layout justify-space-around align-center row >
        <v-flex xs9 >
          <Button class="button" @click="addFixture()" text="add Fixture"/>
          
        </v-flex>
        

        <v-flex xs2 >
          <Numbox class="testNum" name="testChannel" showName="1" @input="testDimmerNum($event.value)" :value="testDimmerNumVal" />
        </v-flex>
      </v-layout>
      <div  v-for="f in universe.sortedFixtureList" :key="f.name" style="background-color:#FFF5;margin:5px">
        <v-layout justify-space-between align-center row >

          <v-flex xs9 >
            <span style="display:flex;width:100%">
              <input :style="{'background-color':'#0003','flex': '1 1 50%'}" :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
              
              <div style=""> base Channel </div>
              <Numbox class="baseCirc" :value="f.baseCirc" :min="0" :max="512" @input="setFixtureBaseCirc({fixture: f, circ: $event.value||0})"></Numbox></span>
            </v-flex>
            
            <v-flex xs1 >
              <Button class="button addChannel" color='green' @click="addChannelToFixture({fixture:f})" text="+ Chan."/>
            </v-flex>
            <v-flex xs1 >
              <Button class="button" @click="duplicateFixture({fixture:f})" text="dupl Fix."/>
            </v-flex>
            <v-flex xs1 >
              <Button class="button removeFixture " color='red' @click="removeFixture({fixture:f})" tabIndex="-1" text="- Fix."/>
            </v-flex>

          </v-layout>

          <div class="channelLine" v-for="c in f.channels" :key="c.id" >
            <v-layout  justify-space-between align-center row wrap>
              <v-flex xs4>
                <v-layout  align-center row >
                  <v-flex xs1 >
                  </v-flex>
                  <v-flex xs1 v-if="f.channels.length>1">
                    <Button class="button removeChannel " color='red' @click="removeChannel({channel:c,fixture:f})" tabIndex="-1" text="-"></Button>
                  </v-flex>
                  <v-flex xs11>
                    <input type="text" :style="{'background-color':'#0003',width:'100%'}" class="channelName " @change="setChannelName({channel:c,name:$event.target.value})" :value="c.name"  >

                  </v-flex>
                  <div>({{c.roleFam}})</div>

                </v-layout>
              </v-flex>
              
              <v-flex xs6>
                <v-layout justify-start align-center row wrap>

                  <v-flex xs3 >
                    <div :style="{  display:'flex' ,padding:'10px'}">
                      <Numbox class="circNum" :value="c.circ" :min="0" :max="512" @input="linkChannelToCirc({channel: c, circ: $event.value})" :errMsg='c.hasDuplicatedCirc===true?"duplicated":""' ></Numbox>

                      <Toggle text="test" :value="universe.testedChannel.circ===c.trueCirc" @input=testDimmerNum($event?c.trueCirc:-1) > T </Toggle>

                    </div>
                  </v-flex>

                  

                </v-layout>
              </v-flex>
            </v-layout>
          </div>
          

        </div>

      </v-container>
      <!-- <hsc-menu-style-white>
        <hsc-menu-button-menu style="margin: 50px;" :fade="10" @open=open() @close=close() :sync="true">
          <div class="box" style="padding: 1em;">
            Secondary click here
          </div>
          <template slot="contextmenu" style="padding: -50px;">
            <hsc-menu-item label="MenuItem 1" />
          </template>
        </hsc-menu-button-menu>
      </hsc-menu-style-white> -->
    </div>
  </template>

  <script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';


import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import { DirectFixture } from '@API/Fixture';
import UniversesMethods from '../store/universes';


const universesModule = namespace('universes');

@Component({
  components: {Button, Numbox, Toggle},
})
export default class ChannelPatch extends Vue {
  public get errors() {
    const errs: {[id: number]: string} = {};
    this.usedChannels.map( (c) => errs[c.circ] = c.hasDuplicatedCirc ? 'circuit is duplicated' : '');
    return errs;
  }


  @universesModule.Mutation('addFixture') public addFixture!: UniversesMethods['addFixture'];
  @universesModule.Mutation('duplicateFixture') public duplicateFixture!: UniversesMethods['duplicateFixture'];
  @universesModule.Mutation('addChannelToFixture') public addChannelToFixture!: UniversesMethods['addChannelToFixture'];
  @universesModule.Mutation('setFixtureBaseCirc') public setFixtureBaseCirc!: UniversesMethods['setFixtureBaseCirc'];




  @universesModule.Mutation('linkChannelToCirc') public linkChannelToCirc!: UniversesMethods['linkChannelToCirc'];
  @universesModule.Mutation('setChannelName') public setChannelName!: UniversesMethods['setChannelName'];
  @universesModule.Mutation('removeChannel') public removeChannel!: UniversesMethods['removeChannel'];

  @universesModule.Mutation('removeFixture') public removeFixture!: UniversesMethods['removeFixture'];
  @universesModule.Mutation('setFixtureName') public setFixtureName!: UniversesMethods['setFixtureName'];

  @universesModule.Getter('testDimmerNumVal') public testDimmerNumVal!: UniversesMethods['testDimmerNumVal'];
  @universesModule.Mutation('testDimmerNum') public testDimmerNum!: UniversesMethods['testDimmerNum'];

  @universesModule.State('universe') private universe!: UniversesMethods['universe'];




  @universesModule.Getter('usedChannels') private usedChannels!: UniversesMethods['usedChannels'];

  public open() {
    // debugger
  }
  public close() {
    debugger;
  }



}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>
.box {
  box-shadow: 0 0 4pt rgba(0, 0, 0, 0.25);
  border-radius: 20pt;
  background-color: rgba(255, 255, 255, 0.25);
  user-select: none;
  cursor: context-menu;
}
</style>
