<template>
  <div class="main">
    <Button text="Go" @click="goToSequence(sequence)" />
    <input :value="seqName" @change="setSequenceName({sequence:sequence,value:$event.target.value})">
    <Numbox :value="sequence.timeIn" @change="setSequenceTimeIn({sequence:sequence,value:$event.value})"/>
    <select  :value="seqStateName" @change="setSequenceStateName({sequence:sequence,value:$event.target.value})" >
      <option v-for="n of stateNames" :key="n.id" :value="n">{{n}}</option>
    </select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from './Button.vue';
import Numbox from './Numbox.vue';
import { Sequence } from '../api/Sequence';
import SequenceMethods from '../store/sequence';
const sequenceModule = namespace('sequence');
const stateModule = namespace('states');
@Component({
  components: {Button, Numbox},
})
export default class SequenceComponent extends Vue {

  @sequenceModule.Mutation('setSequenceName') public setSequenceName!: SequenceMethods['setSequenceName'];
  @sequenceModule.Mutation('setSequenceStateName') public setSequenceStateName!: SequenceMethods['setSequenceStateName'];

  @sequenceModule.Mutation('setSequenceTimeIn') public setSequenceTimeIn!: SequenceMethods['setSequenceTimeIn'];
  @sequenceModule.Action('goToSequence') public goToSequence!: SequenceMethods['goToSequence'];

  @stateModule.Getter('stateNames') public stateNames!: string[];
  @Prop()
  public  sequence?: Sequence;


  get seqName() {
    if (this.sequence  ) {
      return this.sequence.name;
    }
    return 'none';
  }
  get seqStateName() {
    if (this.sequence  ) {
      return this.sequence.stateName;
    }
    return 'none';
  }


}
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  display: flex;
  width:100%;
  background-color: black;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  
}

select{
  min-width: 60px;
}
</style>
