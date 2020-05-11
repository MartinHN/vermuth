<template>
  <div class="home">    
    <StateComponent canEditStates=1 v-model=selectedState :showActions=showActions :maxHeight="'140px'" style="max-height:200px;over" />
    <div v-if="selectedStateIsEditable" >
    <Toggle v-model="showActions" text="show Actions" />
      <ActionList v-if="showActions" :actions="this.selectedState.actions"></ActionList>
      <ChannelRack v-else-if="allFixture" :displayableFixtureList="allFixture" :showPresetableState="true" />
    </div>



  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import {  Action, Getter , Mutation , namespace} from 'vuex-class';
import ChannelRack from '@/components/ChannelRack.vue'; // @ is an alias to /src
import StateComponent from  '@/components/StateComponent.vue';
import { State} from '@API/State'
import UniversesMethods from '../store/universes';
import Toggle from "@/components/Inputs/Toggle.vue";
import ActionList from "@/components/Widgets/ActionList.vue"

const universesModule = namespace('universes');
@Component({
  components: {
    ChannelRack,
    StateComponent,
    Toggle,
    ActionList
  },
})
export default class Home extends Vue {

@universesModule.State('universe') private universe!: UniversesMethods['universe'];

  get allFixture() {
    return this.universe.fixtureAndGroupList;
    // return this.universe.sortedFixtureList;
  }
  get selectedStateIsEditable(){
    console.log("getting state",this.selectedState)
    return this.selectedState && !this.selectedState.name.startsWith('__')
  }
  public showActions=false
  public selectedState:State|null=null
}
</script>
