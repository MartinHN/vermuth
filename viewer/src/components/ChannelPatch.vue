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
          <Numbox class="testNum" name="testChannel" showName="1" @input="testDimmerNum($event.value)" />
        </v-flex>
      </v-layout>
      <div  v-for="f in universe.fixtureList" :key="f.id" >
        <v-layout justify-space-between align-center row >

          <v-flex xs9 >
            <input :style="{'background-color':'#0003',width:'100%'}" :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
            <span><Numbox class="baseCirc" :value="f.baseCirc" :min="0" :max="512" @input="setFixtureBaseCirc({fixture: f, circ: $event.value})"></Numbox></span>
          </v-flex>
          <v-flex xs1 >
            <Button class="button removeFixture " color='red' @click="removeFixture({fixture:f})" tabIndex="-1" text="x"/>
          </v-flex>
          <v-flex xs1 >
            <Button class="button addChannel" color='green' @click="addChannelToFixture({fixture:f})" text="+ Channel"/>
          </v-flex>
          <v-flex xs1 >
          <Button class="button" @click="duplicateFixture({fixture:f})" text="duplicate Fixture"/>
        </v-flex>

        </v-layout>

        <div class="channelLine" v-for="c in f.channels" :key="c.id" >
          <v-layout  justify-space-between align-center row wrap>
            <v-flex xs4>
              <v-layout  align-center row >
                <v-flex xs1 >
                </v-flex>
                <v-flex xs1 >
                  <Button class="button removeChannel " color='red' @click="removeChannel({channel:c,fixture:f})" tabIndex="-1" text="-"></Button>
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
                    <Numbox class="circNum" :value="c.circ" :min="0" :max="512" @input="linkChannelToCirc({channel: c, circ: $event.value})" :errMsg='c.hasDuplicatedCirc===true?"duplicated":""' ></Numbox>
                    <Toggle @input=setChannelReactToMaster({channel:c,value:$event}) :value=c.reactToMaster > React to Master</Toggle>
                    <Toggle text="test" :value="universe.testedChannel.circ===c.trueCirc" @input=testDimmerNum({channel:$event?c.trueCirc:-1}) > T </Toggle>

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
  @universesModule.Mutation('setChannelReactToMaster') public setChannelReactToMaster!: UniversesMethods['setChannelReactToMaster'];
@universesModule.Mutation('testDimmerNum') public testDimmerNum!: UniversesMethods['testDimmerNum'];

  @universesModule.State('universe') private universe!: UniversesMethods['universe'];




  @universesModule.Getter('usedChannels') private usedChannels!: UniversesMethods['usedChannels'];


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>

</style>
