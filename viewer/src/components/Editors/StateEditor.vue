
<template>

  <div class="main"  style="width:100%;height:100%">
    <div style="display:flex;flex-direction:row;width:100%">

      <v-row style="width:100%">
        <v-col cols=12>
          <v-list dense class="overflow-y-auto" style=max-height:200px >

            <v-list-item-group v-model="selectedFixtureIdxs" multiple> <!-- v-model="item" color="primary"> -->
              <v-list-item v-for="(s,i) in selectableFixtureListNames" :key=s.id>
                <v-list-item-content >
                  <v-list-item-title v-html="s" ></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-col>
      </v-row>
      <br/>
      <v-select label=groups multiple class="selectclass"  v-model="selectedGroupNames" style="width:100%" :items=selectableGroupList>
      </v-select>
      <v-select label=famillies multiple class="selectclass"  v-model=selectedChannelFilterNames :items=selectableChannelFilterList >
      </v-select>


    </div>
    <div style="width:100%">
      <v-row no-gutters>
        <v-col cols=6>
          <Toggle  v-model=showProps text="show props"></Toggle>
        </v-col>
        
      </v-row>
    </v-row>
    <fixture-widget  style="margin:10px 0 0 0;width:100%;background-color:#FFF5" class="channel" v-for="f in selectedFixtures" :key="f.id" :fixtureProp="f" :showName="showNames" :showValue="showValues" :filterList="selectedChannelFilterNames" :showProps="showProps"></fixture-widget>
  </div>

</div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
import {  Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import TextInput from '@/components/Inputs/TextInput.vue';
import FixtureWidget from '@/components/FixtureWidget.vue' ;
import Modal from '@/components/Utils/Modal.vue';

import UniversesMethods from '../../store/universes';
import {FixtureBase} from '@API/Fixture';
import {State} from '@API/State';
import rootState from '@API/RootState';
import { FixtureFactory } from '@API/FixtureFactory';
import { ChannelRoles } from '@API/Channel';

const universesModule = namespace('universes');



@Component({
  components: {Button, Numbox, Toggle, TextInput, FixtureWidget},
})
export default class StateEditor extends Vue {
  @Prop({default: null, required: true})
  public state !: State | null;


  @Prop({default: false})
  public readonly ?: boolean;

  public selectedFixtureIdxs = new Array<number>();

  public showProps = false;
  public showValues = false;
  public showNames = false;

  @universesModule.State('universe') private universe!: UniversesMethods['universe'];

  private pselectedFixtureNames: string[] = [];
  private pselectedGroupNames: string[] = ['all'];
  private pselectedChannelFilterNames: string[] = ['all'];
  private extendedTypeFilter = false;


  get selectedFixtures() {
    return this.universe.getFixtureListFromNames(this.selectedFixtureNames);
  }

  
  get selectedFixtureNames() {
    return this.selectedFixtureIdxs.map(i=>this.selectableFixtureListNames[i])
    // return this.selectedFixtures.map(e=>e.name);
  }
  get selectableFixtureListNames() {
    return this.selectableFixtures.map((e) => e.name);
  }

  get selectableFixtures(){
    return this.universe.sortedFixtureList
  }
  get selectableGroupList() {
    return ['all'].concat(this.universe.groupNames);
  }
  public get selectedGroupNames() {
    return this.pselectedGroupNames;
  }
  public set selectedGroupNames(v: string[]) {
    this.pselectedGroupNames = v;
    this.syncGroupSelection();
  }

  set selectedChannelFilterNames(l: string[]) {
    this.pselectedChannelFilterNames = l;
    this.syncFilterSelection();
  }
  get selectedChannelFilterNames() {
    return this.pselectedChannelFilterNames;
  }
  get displayedFixtures() {
    return this.universe.sortedFixtureList.filter((f) => this.needDisplay(f) && f.hasChannelMatchingFilters(this.selectedChannelFilterNames));
  }

  get selectableChannelFilterList() {
    const res: string[] = ['all'];

    for ( const fam of Object.keys(ChannelRoles)) {
      res.push(fam);
      if (this.extendedTypeFilter) {
        for ( const type of Object.keys(ChannelRoles[fam])) {
          res.push(fam + ':' + type);
        }
      }
    }
    return res;
  }

  public syncGroupSelection() {
    if (this.selectedGroupNames.length === 0) {return; }
    if (this.selectedGroupNames.find((e) => e === 'all')) {
      this.pselectedFixtureNames = this.selectableFixtureListNames;
      return;
    }
    const toSel: {[id: string]: boolean} = {};
    const lastSel = this.selectedGroupNames;
    for (const g of this.selectedGroupNames) {
      for (const f  of this.universe.groups[g]) {
        toSel[f] = true;
      }
    }
    const toSelL = Object.keys(toSel);
    this.pselectedFixtureNames = toSelL;
  }

  public syncFilterSelection() {

  }

  public selectAll() {
    let i = -1;
    this.selectedFixtureIdxs = this.selectableFixtures.map(e=>{i++;return i})
    
  }

  public needDisplay(f: FixtureBase) {

    if (this.selectedFixtureNames && this.selectedFixtureNames.length === 0) {
      return true;
    } else {
      return this.selectedFixtureNames.find((fn) => fn === f.name);
    }
  }

  public get firstGroupSelected() {
    return this.selectedGroupNames.length > 0 ? this.selectedGroupNames[0] : '';
  }


  public addGroup() {
    if (this.selectedFixtureNames && this.selectedFixtureNames.length > 0) {
      const gname = prompt('save new group', 'group');
      if (gname) {
        this.universe.addGroup(gname, this.selectedFixtureNames);
      }
    } else {
      alert('no fixtures selected');
    }
  }
  public removeGroup() {
    const gname = prompt('remove group', this.firstGroupSelected);
    if (gname && gname !== 'all') {
      this.universe.removeGroup(gname);
    }
  }


  public mounted() {
    debugger
    if(this.state){
     const resolvedFixtures =  this.state.resolveState(this.universe.fixtureList,rootState.stateList.states,1)
     for(const rf of Object.values(resolvedFixtures)){

      const i = this.selectableFixtures.indexOf(rf.fixture)
      if(i>=0 && this.selectedFixtureIdxs.indexOf(i)<0){
        this.selectedFixtureIdxs.push(i)
      }
    }
  }

}



}
</script>


<style scoped>
</style>