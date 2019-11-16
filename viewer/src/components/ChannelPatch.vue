<template>
  <div class="main">
    ChannelPatch
    <br/>
    <v-container class="ChannelPatch" fluid>
      <v-row>
        <v-col cols=8 >
          <Button class="button" @click="addFixture()" text="add Fixture"/>
        </v-col>

        <v-col cols=2 >
          <Numbox style=width:30px class="testNum" name="testChannel" showName="1" @input="testDimmerNum($event.value)" :value="testDimmerNumVal" />
        </v-col>
      </v-row>
      <v-row  v-for="f in universe.sortedFixtureList" :key="f.name" style="background-color:#FFF5;margin:5px" no-gutters>
        <v-col cols=12 class="FixtureHeader"> 
          <v-row no-gutters>
            <v-col cols=6>
              <input :style="{'background-color':'#0003','width':'100%'}" :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
            </v-col>
            <v-col cols=3>
              <div class="pa-0 ma-0"> base Channel </div>

              <Numbox class="baseCirc pa-0 ma-0" :value="f.baseCirc" :min="0" :max="512" @input="setFixtureBaseCirc({fixture: f, circ: $event.value||0})"></Numbox>
            </v-col>


            <v-col cols=1 >
              <Button class="button addChannel" color='green' @click="addChannelToFixture({fixture:f})" text="+ Chan."/>
            </v-col>
            <v-col cols=1 >
              <Button class="button" @click="duplicateFixture({fixture:f})" text="dupl Fix."/>
            </v-col>
            <v-col cols=1 >
              <Button class="button removeFixture " color='red' @click="removeFixture({fixture:f})" tabIndex="-1" text="- Fix."/>
            </v-col>

          </v-row>
        </v-col>


        <v-col cols=12 class="channelLine" v-for="c in f.channels" :key="c.id" >

          <v-row no-gutters>

            <v-col cols=1 v-if="f.channels.length>1">
              <Button class="button removeChannel " color='red' @click="removeChannel({channel:c,fixture:f})" tabIndex="-1" text="-"></Button>
            </v-col>
            <v-col cols=2>
              <input type="text" :style="{'background-color':'#0003',width:'100%'}" class="channelName " @change="setChannelName({channel:c,name:$event.target.value})" :value="c.name"  >

            </v-col>
            <v-col cols=undefined>({{c.roleFam}})</v-col>



            <v-col cols=3>
              <Numbox class="circNum" :value="c.circ" :min="0" :max="512" @input="linkChannelToCirc({channel: c, circ: $event.value})" :errMsg='c.hasDuplicatedCirc===true?"duplicated":""' ></Numbox>
            </v-col>
            <v-col cols=2>
              <Toggle text="test" :value="universe.testedChannel.circ===c.trueCirc" @input=testDimmerNum($event?c.trueCirc:-1) > T </Toggle>
            </v-col>

          </v-row>
        </v-col>
      </v-row>




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
