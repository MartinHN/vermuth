<template>
  <div class="main">
    <Button text="Go" @click="goToSequenceNamed({name:sequence.name})"  style="width:20%"/>
    <Button text="Black" @click="goToSequenceNamed({name:sequence.name,dimMaster:0})" style="width:20%" />
    <text-input :value="seqName" @change="setSequenceName({sequence:sequence,value:$event.value})"/>
    <Numbox :value="sequence.timeIn" @change="setSequenceTimeIn({sequence:sequence,value:$event.value})"/>
    <v-select :items=stateNames :value="seqStateName" @change="setSequenceStateName({sequence:sequence,value:$event})" >
    </v-select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import TextInput from '@/components/Inputs/TextInput.vue';
import { Sequence } from '@API/Sequence';
import SequenceMethods from '../store/sequence';
const sequenceModule = namespace('sequence');
const stateModule = namespace('states');
@Component({
  components: {Button, Numbox, TextInput},
})
export default class SequenceComponent extends Vue {

  @sequenceModule.Mutation('setSequenceName') public setSequenceName!: SequenceMethods['setSequenceName'];
  @sequenceModule.Mutation('setSequenceStateName') public setSequenceStateName!: SequenceMethods['setSequenceStateName'];

  @sequenceModule.Mutation('setSequenceTimeIn') public setSequenceTimeIn!: SequenceMethods['setSequenceTimeIn'];
  @sequenceModule.Action('goToSequenceNamed') public goToSequenceNamed!: SequenceMethods['goToSequenceNamed'];

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
  public blackSequence() {
    if (this.sequence  ) {
      return this.sequence.stateName;
    }
  }





}
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  display: flex;
  width:100%;
  background-color: transparent;
  border-color: black;
  border-width: 1px;
  border-style: solid;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  
}
* input {
      min-width: 10px;
}

select{
  min-width: 60px;
}
</style>
