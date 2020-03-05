<template>
  <div class="main">
    <div class="Sequencer">
      <v-container fluid>
        <v-row no-gutters >
          <v-col cols=3>
      <div> {{globalTransport.beat}}</div>
    </v-col>
    <v-col cols=3>
        <Toggle v-model=togglePlay style="height:40px" :text=playState> </Toggle>

      </v-col>
        </v-row>
        <v-row no-gutters >
          <v-col cols=6>
            <Toggle v-model=editOrder text="Edit"/>
          </v-col>
          <v-col cols=3>
            <Button @click="saveCurrentSequence()" text="add Sequence"/>
          </v-col>
          <v-col>
            <Numbox text="idx" :value=playedIdx @change="playedIdx=$event" ></Numbox>
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
import rootState from '@API/RootState';
const sequenceModule = namespace('sequence');


@Component({
  components: {Button, Numbox, SequenceComponent, Toggle},
})
export default class Sequencer extends Vue {

  @sequenceModule.Mutation('addSequence') public addSequence!: SequenceMethods['addSequence'];
  @sequenceModule.Action('saveCurrentSequence') public saveCurrentSequence!: SequenceMethods['saveCurrentSequence'];
  @sequenceModule.State('sequenceList') public sequenceList!: SequenceMethods['sequenceList'];
  @sequenceModule.State('globalTransport') public globalTransport!: SequenceMethods['globalTransport'];

  public editOrder = false;


  mounted(){
    window.addEventListener('keydown', this.processKey)
  }
  destroyed(){
    window.removeEventListener('keydown', this.processKey)
  }
  private processKey(event:KeyboardEvent){
    // console.log(event)
    if (event.ctrlKey || event.metaKey) {
      if(event.key==="ArrowDown"){
        this.next()
      }
      else if(event.key==="ArrowUp"){
        this.prev()
      }
      // const letter  =String.fromCharCode(event.which).toLowerCase();
        
    }
    

  }

  get isPlayingSeq() {
    return this.seqPlayer.isPlaying;
  }
  get playState() {
    return this.globalTransport.isPlaying ? 'stop' : 'play';
  }
  get playedIdx() {
    return this.seqPlayer.curPlayedIdx;
  }
  set playedIdx(n: number) {
    this.seqPlayer.curPlayedIdx = n;
  }

  public getHighlightedColor(i: number) {
    return this.playedIdx === i ? (this.isPlayingSeq ? 'green' : 'lightgreen') : '';
  }


  get seqList() {
    return this.sequenceList.listGetter;
  }

  get seqPlayer() {
    return rootState.sequencePlayer;
  }

  get togglePlay() {
    return this.globalTransport.isPlaying;
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

  next(){
    this.playedIdx = Math.max(0,Math.min(this.seqList.length-1,this.playedIdx+1))
  }
  prev(){
    this.playedIdx = Math.max(0,Math.min(this.seqList.length-1,this.playedIdx-1))
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
