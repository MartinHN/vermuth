<template>
  <div class="main">
    Sequencer
    <br/>
    <div class="Sequencer">
      <!-- <div> {{globalTransport.beat}}</div>
        <Toggle v-model=togglePlay style="height:40px" :text=globalTransport.isPlaying> </Toggle> -->
        <v-container fluid>
        <v-row no-gutters >
          <v-col cols=6>
            <Toggle v-model=editOrder text="Edit"/>
          </v-col>
          <v-col cols=3>
            <Button @click="saveCurrentSequence()" text="add Sequence"/>
          </v-col>
          <v-col>
            <Numbox text="idx" :value=playedIdx @change="playedIdx=$event.value" ></Numbox>
          </v-col>
        </v-row>
      </v-container>
        <SequenceComponent v-for="(s,i) in seqList" :editMode=editOrder :key='s.id' :seqNumber=i :sequence="s" :style="{background:getHighlightedColor(i)}" />

      </div>
    </div>

  </template>

  <script lang="ts">
  import { Component, Prop, Vue } from 'vue-property-decorator';
  import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
  import Button from '@/components/Inputs/Button.vue';
  import Toggle from '@/components/Inputs/Toggle.vue';
  import Numbox from '@/components/Inputs/Numbox.vue';
  import SequenceComponent from './SequenceComponent.vue';
  import { Sequence } from '@API/Sequence';
  import SequenceMethods from '../store/sequence';
  import rootState from '@API/RootState'
  const sequenceModule = namespace('sequence');


  @Component({
    components: {Button, Numbox, SequenceComponent, Toggle},
  })
  export default class Sequencer extends Vue {

    @sequenceModule.Mutation('addSequence') public addSequence!: SequenceMethods['addSequence'];
    @sequenceModule.Action('saveCurrentSequence') public saveCurrentSequence!: SequenceMethods['saveCurrentSequence'];
    @sequenceModule.State('sequenceList') public sequenceList!: SequenceMethods['sequenceList'];
    @sequenceModule.State('globalTransport') public globalTransport!: SequenceMethods['globalTransport'];

    editOrder = false
    get isPlayingSeq(){
      return this.seqPlayer.isPlaying
    }
    get playedIdx(){
      return this.seqPlayer.curPlayedIdx
    }
    set playedIdx(n:number){
      this.seqPlayer.curPlayedIdx = n
    }

    getHighlightedColor(i:number){
      return this.playedIdx===i?(this.isPlayingSeq?'green':'lightgreen'):''
    }

    get togglePlay() {
      return this.globalTransport.isPlaying;
    }
    get seqList(){
      return this.sequenceList.listGetter
    }

    get seqPlayer(){
      return rootState.sequencePlayer
    }
    set togglePlay(v: boolean) {
      if (v) {
        this.globalTransport.start();
      } else {
        this.globalTransport.stop();
      }
    }
    get playText() {
      return this.togglePlay ? 'stop' : 'play';
    }
  }
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.Sequencer {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
}
.seqLine{
  width: 100%;
  margin:20px;
  /*height:100px;*/
  display: flex;
  justify-content: space-between;
  align-items: center;
  
}


.circNum{
  /*width: 30px;*/
  font-size: x-large;
}

.channelName{
  left: 0;
  flex:0 0 30%;
  font-size: x-large;
  /*display: None;*/
}

.circCell{
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

</style>
