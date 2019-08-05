<template>
  <div class="main">
    Sequencer
    <br/>
    <div class="Sequencer">
      <Button class="button addSequence" @click="saveCurrentSequence()" text="add Sequence"/>
      <SequenceComponent v-for="s in sequences" :key='s.id' :sequence="s" />

    </div>
  </div>

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from './Button.vue';
import Numbox from './Numbox.vue';
import SequenceComponent from './SequenceComponent.vue';
import { Sequence } from '@API/Sequence';
import SequenceMethods from '../store/sequence';
const sequenceModule = namespace('sequence');

@Component({
  components: {Button, Numbox, SequenceComponent},
})
export default class Sequencer extends Vue {

  @sequenceModule.Mutation('addSequence') public addSequence!: SequenceMethods['addSequence'];
  @sequenceModule.Action('saveCurrentSequence') public saveCurrentSequence!: SequenceMethods['saveCurrentSequence'];
  @sequenceModule.State('sequenceList') public sequences!: SequenceMethods['sequenceList'];

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
