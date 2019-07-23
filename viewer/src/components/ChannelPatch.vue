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
      <div  v-for="f in universe.fixtures" :key="f.id" >
        <v-layout justify-space-between align-center row >

          <v-flex xs11 >
            <input :style="{'background-color':'#0003',width:'100%'}" :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
            <span><Numbox class="baseCirc" :value="f.baseCirc" :min="0" :max="512" @input="sefFixtureBaseCirc({fixture: f, circ: $event.value})"></Numbox></span>
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

                <v-flex xs3 >
                  <div :style="{  display:'flex' ,padding:'10px'}">
                    <Numbox class="circNum" :value="c.circ" :min="0" :max="512" @input="linkChannelToCirc({channel: c, circ: $event.value})" :errMsg='errors[c.circ]' ></Numbox>
                    <Toggle @input=setChannelReactToMaster({channel:c,value:$event}) :value=c.reactToMaster > React to Master</Toggle>
                    <Toggle text="test" :value="testedChannel===c" @input=testChannel({channel:$event?c:null}) > T </Toggle>

                  </div>
                </v-flex>

                

              </v-layout>
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
import Toggle from './Toggle.vue';
import { DirectFixture } from '../api/Fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Button, Numbox, Toggle},
})
export default class ChannelPatch extends Vue {


  public get errors() {
    const errs: {[id: number]: string} = {};
    this.usedChannels.map( (c) => errs[c.circ] = c.hasDuplicatedCirc ? 'circuit is duplicated' : '');
    return errs;
  }

  @fixturesModule.Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  @fixturesModule.Mutation('addChannelToFixture') public addChannelToFixture!: FixtureMethods['addChannelToFixture'];
  @fixturesModule.Mutation('sefFixtureBaseCirc') public sefFixtureBaseCirc!: FixtureMethods['sefFixtureBaseCirc'];




  @fixturesModule.Mutation('linkChannelToCirc') public linkChannelToCirc!: FixtureMethods['linkChannelToCirc'];
  @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];
  @fixturesModule.Mutation('removeChannel') public removeChannel!: FixtureMethods['removeChannel'];

  @fixturesModule.Mutation('removeFixture') public removeFixture!: FixtureMethods['removeFixture'];
  @fixturesModule.Mutation('setFixtureName') public setFixtureName!: FixtureMethods['setFixtureName'];
  @fixturesModule.Mutation('setChannelReactToMaster') public setChannelReactToMaster!: FixtureMethods['setChannelReactToMaster'];
@fixturesModule.Mutation('testChannel') public testChannel!: FixtureMethods['testChannel'];

  @fixturesModule.State('universe') private universe!: FixtureMethods['universe'];


  @fixturesModule.State('testedChannel') private testedChannel!: FixtureMethods['testedChannel'];

  @fixturesModule.Getter('usedChannels') private usedChannels!: FixtureMethods['usedChannels'];


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>

</style>
