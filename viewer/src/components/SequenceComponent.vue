<template>
  <div class="main">
    <v-container fluid class="pa-0 ma-0">
      <v-row dense>
        <v-col cols="3">
          <text-input
            :editable="editMode"
            :value="seqName"
            @change="
              setSequenceName({ sequence: sequence, value: $event.value })
            "
          />
        </v-col>
        <v-col v-if="editMode" cols="1">
          <Button
            text="-"
            color="red"
            @click="seqList.remove(sequence)"
            icon="delete"
          />
        </v-col>
        <v-col v-if="editMode" cols="2">
          <Button text="up" @click="seqList.up(sequence)" icon="chevron-up" />
          <Button
            text="down"
            @click="seqList.down(sequence)"
            icon="chevron-down"
          />
        </v-col>
        <v-col cols="2" v-if="!editMode" style="display: block">
          <Button text="Go" @mousedown="go" icon="play" />
          <div :style="{ width: '100%', height: '5px' }">
            <div
              :style="{ width: progess, height: '100%', background: 'red' }"
            ></div>
          </div>
        </v-col>
        <!-- <Button text="Black" @click="goToSequenceNamed({name:sequence.name,dimMaster:0})" style="width:20%" /> -->

        <v-col v-if="editMode" cols="2">
          <Toggle
            :value="sequence.doNotPrepareNext"
            @input="sequence.doNotPrepareNext = $event"
            text="noPrepare"
          />
        </v-col>
        <v-col v-else cols="2">
          <Numbox
            :value="sequence.timeIn"
            @input="setSequenceTimeIn({ sequence: sequence, value: $event })"
            hide-details
          />
        </v-col>

        <v-col>
          <v-select
            :active="editMode"
            :items="stateNames"
            :value="seqStateName"
            @change="
              setSequenceStateName({ sequence: sequence, value: $event })
            "
            hide-details
          ></v-select>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import Numbox from "@/components/Inputs/Numbox.vue";
import TextInput from "@/components/Inputs/TextInput.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import { Sequence } from "@API/Sequence";
import rootState from "@API/RootState";
import SequenceMethods from "../store/sequence";
const sequenceModule = namespace("sequence");
const stateModule = namespace("states");
@Component({
  components: { Button, Numbox, TextInput, Toggle },
})
export default class SequenceComponent extends Vue {
  @sequenceModule.Mutation("setSequenceName")
  public setSequenceName!: SequenceMethods["setSequenceName"];
  @sequenceModule.Mutation("setSequenceStateName")
  public setSequenceStateName!: SequenceMethods["setSequenceStateName"];

  @sequenceModule.Mutation("setSequenceTimeIn")
  public setSequenceTimeIn!: SequenceMethods["setSequenceTimeIn"];
  @sequenceModule.Action("goToSequenceNamed")
  public goToSequenceNamed!: SequenceMethods["goToSequenceNamed"];

  @stateModule.Getter("stateNames") public stateNames!: string[];
  @Prop()
  public sequence?: Sequence;

  @Prop({ default: false })
  public editMode!: boolean;

  @Prop({ default: false })
  public selected!: boolean;

  @Prop({ required: true })
  public seqNumber!: number;
  get seqList() {
    return rootState.sequenceList;
  }

  get seqName() {
    if (this.sequence) {
      return this.sequence.name;
    }
    return "none";
  }
  get seqStateName() {
    if (this.sequence) {
      return this.sequence.stateName;
    }
    return "none";
  }
  public blackSequence() {
    if (this.sequence) {
      return this.sequence.stateName;
    }
  }
  get seqPlayer() {
    return rootState.sequencePlayer;
  }
  get isPlaying() {
    return (
      this.seqPlayer.isPlaying && this.seqPlayer.curPlayedIdx === this.seqNumber
    );
  }
  get progess() {
    return (this.isPlaying ? this.seqPlayer.pctDone * 100 + "" : "0") + "%";
  }

  go() {
    this.seqPlayer.curPlayedIdx = this.seqNumber;
  }
}
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  display: flex;
  width: 100%;
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

select {
  min-width: 60px;
}
</style>
