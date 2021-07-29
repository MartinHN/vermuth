<template>
  <div class="home">
    <StateComponent
      canEditStates="1"
      v-model="selectedState"
      :showActions="showActions"
      :maxHeight="'140px'"
      style="max-height:200px;over"
      :presetableState="presetableState"
      
    />
    <div v-if="allFixture">
      <Toggle v-model="showActions" text="show Actions" />
      <ActionList v-if="showActions" :actions="selectedState.actions"></ActionList>
      <ChannelRack
        v-else
        :displayableFixtureList="allFixture"
        :showPresetableState="true"
        :presetableState.sync="presetableState"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Action, Getter, Mutation, namespace } from "vuex-class";
import ChannelRack from "@/components/ChannelRack.vue"; // @ is an alias to /src
import StateComponent from "@/components/StateComponent.vue";
import { State } from "@API/State";
import UniversesMethods from "../store/universes";
import Toggle from "@/components/Inputs/Toggle.vue";
import ActionList from "@/components/Widgets/ActionList.vue";
import rootState from "@API/RootState"


const universesModule = namespace("universes");
@Component({
  components: {
    ChannelRack,
    StateComponent,
    Toggle,
    ActionList
  }
})
export default class PresetView extends Vue {
  @universesModule.State("universe")
  private universe!: UniversesMethods["universe"];

  get allFixture() {
    return this.universe.fixtureAndGroupList;
    // return this.universe.sortedFixtureList;
  }
  get selectedStateIsEditable() {
    console.log("getting state", this.selectedState);
    return this.selectedState && !this.selectedState.name.startsWith("__");
  }
  public showActions = false;
  public selectedState: State | null = null;

  public get presetableState() {
    const curS = rootState.stateList.currentState
    // debugger
    return this.selectedState ? this.selectedState.presetableState :curS.presetableState;
  }
  public set presetableState(s: any) {
    // debugger;
    if (this.selectedState) {
      this.selectedState.presetableState = s;
    }
  }
}
</script>
