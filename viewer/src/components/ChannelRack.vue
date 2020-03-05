<template>
  <div class="ChannelRack">
    <!-- <div class="header">
      <StateComponent class="StateComponent"></StateComponent>
    </div> -->
    <div style="display:flex;width:100%;padding:5px">
      <slider style="flex:1 0 75%" class="grandMaster" @input="setGrandMasterValue($event)" :value="grandMaster" name="grandMaster"  showName="1" showValue="1" ></slider>
      <input type="color" @input="setAllColorHex($event.target.value)"></input>
    </div>
    <div style="display:flex;flex-direction:row;width:100%">
      <div>
        <v-select label=fixtures class="selectclass" multiple  v-model="selectedFixtureNames" style="width:100%" :items=displayableFixtureNames>
        </v-select>
        
        <Button text="addGroup" @click="addGroup()" color="green"></Button>
        <Button text="removeGroup" @click="removeGroup()" color="red"></Button>
        
        <v-select label=groups multiple class="selectclass"  v-model="selectedGroupNames" style="width:100%" :items=selectableGroupList>
        </v-select>
        <v-select label=famillies multiple class="selectclass"  v-model=selectedChannelFilterNames :items=selectableChannelFilterList >
        </v-select>
        <Toggle v-model=extendedTypeFilter text="extended Filters"></Toggle>
        
      </div>
      <div style="width:100%">
        <v-row no-gutters>
          <v-col cols=6>
            <Toggle  v-model=showProps text="show props"></Toggle>
            <Toggle  v-model=showEnabled text="show only enabled"></Toggle>
            <Toggle  v-model=showActive text="show only active"></Toggle>
          </v-col>
          <v-col cols>
            <Button  @click="disableOrEnableAll(false)" text="disable All"></Button>
            <Button  @click="disableOrEnableAll(true)" text="enable All"></Button>
          </v-col>
          
        </v-row>
      </v-row>
      <fixture-widget  style="margin:10px 0 0 0;width:100%;background-color:#FFF5" class="channel" v-for="f in displayedFixtures" :key="f.id" :fixtureProp="f" :showName="showNames" :showValue="showValues" :filterList="selectedChannelFilterNames" :showProps="showProps"></fixture-widget>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import {rgbToHex, hexToRgb} from '@API/ColorUtils';
import FixtureWidget from './Widgets/FixtureWidget.vue' ;
import StateComponent from './StateComponent.vue';

import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Slider from '@/components/Inputs/Slider.vue';

import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import { DirectFixture , FixtureBase} from '@API/Fixture';
import { ChannelRoles } from '@API/Channel';
import UniversesMethods from '../store/universes';


const universesModule = namespace('universes');

@Component({
  components: {FixtureWidget, Button, Toggle, StateComponent, Slider},
})
export default class ChannelRack extends Vue {


  @Prop({required: true})
  public displayableFixtureList!: FixtureBase[];

  set selectedFixtureNames(l: string[]) {
    this.pselectedFixtureNames = l;
    if (this.pselectedFixtureNames.length > 0) {
      this.selectedGroupNames = [];
    }
  }
  get selectedFixtureNames() {
    return this.pselectedFixtureNames;
  }
  get displayableFixtureNames() {
    return this.displayableFixtureList.map((e) => e.name);
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
    return this.displayableFixtureList.filter((f) => this.needDisplay(f) && f.hasChannelMatchingFilters(this.selectedChannelFilterNames));
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

  public get firstGroupSelected() {
    return this.selectedGroupNames.length > 0 ? this.selectedGroupNames[0] : '';
  }



  public showNames = false;
  public showValues = true;
  public showProps = false;
  public showEnabled = false;
  public showActive = false;


  private pselectedFixtureNames: string[] = [];
  private pselectedGroupNames: string[] = ['all'];
  private pselectedChannelFilterNames: string[] = ['all'];
  private extendedTypeFilter = false;
  @universesModule.State('universe') private universe!: UniversesMethods['universe'];
  @universesModule.Getter('grandMaster') private grandMaster!: UniversesMethods['grandMaster'];
  @universesModule.Mutation('setAllColor') private setAllColor!: UniversesMethods['setAllColor'];

  public setGrandMasterValue(v: number) {
    debugger;
    for (const f of this.displayedFixtures) {
      if (f.enabled) {f.setMaster(v); }
    }
  }

  public disableOrEnableAll(en: boolean) {
    for (const f of this.displayableFixtureList) {
      for (const c of f.channels) {
        c.enabled = en;
      }
    }
  }

  public setAllColorHex(h: string) {
    const color = hexToRgb(h, true);
    if (color) {
      this.setAllColor({color, setWhiteToZero: true});
    }
  }

  public syncGroupSelection() {
    if (this.selectedGroupNames.length === 0) {return; }
    if (this.selectedGroupNames.find((e) => e === 'all')) {
      this.pselectedFixtureNames = this.displayableFixtureNames;
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
    this.selectedFixtureNames = this.displayableFixtureList.map((e) => e.name);
  }

  public needDisplay(f: FixtureBase) {
    let needDisplay = true;
    if (this.showEnabled) {
      needDisplay = needDisplay && f.channels.some((c) => c.enabled);
    }
    if (this.showActive) {
      needDisplay = needDisplay && f.channels.some((c) => c.floatValue > 0);
    }
    if (!(this.selectedFixtureNames && this.selectedFixtureNames.length === 0) ) {
      needDisplay = needDisplay && (this.selectedFixtureNames.find((fn) => fn === f.name) !== undefined);
    }
    return needDisplay;
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

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ChannelRack {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  background-color: gray;
}
.header {
  display: flex;
  width:100%;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  background-color: darkgrey;
}
.channel{
  width:100%;
}
.StateComponent{
  flex: 1 1 30%;
}
.grandMaster{
  width:100%;
}
/*.selectclass:focus {
    outline: none;
    }*/

  </style>
