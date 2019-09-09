<template>
  <div class="ChannelRack">
    <div class="header">
      <!-- <Button @click="addFixture()" text="addFixture"/> -->
      <StateComponent class="StateComponent"></StateComponent>
      <!-- <toggle :showName="true" v-model="showNames" text="showNames" ></toggle> --> 
      <!-- <toggle name="showValues" v-model="showValues" ></toggle>  -->
      
    </div>
    <toggle style="min-height:20px" text="miniMode" v-model="miniMode" ></toggle>
    <div style="display:flex;flex-direction:row;width:100%">
      <div>
        <select class="selectclass" multiple  v-model="selectedFixtureNames" style="width:100%">
          <option v-for="n of universe.sortedFixtureList.map(e=>e.name)" :key="n.id" :value="n">{{n}}</option>
        </select>
        <Button text="selectAll" @click="selectAll()"></Button>
        <toggle style="min-height:20px" text="show selected" v-model="showSelected" ></toggle>
        <Button text="addGroup" @click="addGroup()" color="green"></Button>
        <Button text="removeGroup" @click="removeGroup()" color="red"></Button>
        
        <select multiple class="selectclass"  v-model="selectedGroupNames" style="width:100%">
          <option v-for="n of universe.groupNames" :key="n.id" :value="n">{{n}}</option>
        </select>
        
      </div>
      <div style="width:100%">
        <div style="display:flex;width:100%">
          <slider style="flex:1 0 75%" class="grandMaster" @input="setGrandMasterValue($event)" :value="grandMaster" name="grandMaster"  showName="1" showValue="1" ></slider>
          <input type="color" @input="setAllColorHex($event.target.value)"></input>
        </div>
        <fixture-widget v-if="needDisplay(f)" style="margin:10px 0 0 0;width:100%;background-color:#FFF5" class="channel" v-for="f in universe.sortedFixtureList" :key="f.id" :fixtureProp="f" :showName="showNames" :showValue="showValues" :miniMode="miniMode"></fixture-widget>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import {rgbToHex, hexToRgb} from '@API/ColorUtils';
import FixtureWidget from './FixtureWidget.vue' ;
import StateComponent from './StateComponent.vue';
import Button from './Button.vue';
import Toggle from './Toggle.vue';
import Slider from './Slider.vue';

import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import { DirectFixture , FixtureBase} from '@API/Fixture';
import UniversesMethods from '../store/universes';


const universesModule = namespace('universes');

@Component({
  components: {FixtureWidget, Button, Toggle, StateComponent, Slider},
})
export default class ChannelRack extends Vue {

  @universesModule.Mutation('addFixture') public addFixture!: UniversesMethods['addFixture'];

  public showNames = false;
  public showValues = true;
  public miniMode = false;
  public showSelected = false;
  private selectedFixtureNames: string[] = [];
  private pselectedGroupNames: string[] = [];
  @universesModule.State('universe') private universe!: UniversesMethods['universe'];
  @universesModule.Getter('grandMaster') private grandMaster!: UniversesMethods['grandMaster'];

  @universesModule.Mutation('setGrandMasterValue') private setGrandMasterValue!: UniversesMethods['setGrandMasterValue'];
  @universesModule.Mutation('setAllColor') private setAllColor!: UniversesMethods['setAllColor'];

  public setAllColorHex(h: string) {
    const color = hexToRgb(h, true);
    if (color) {
      this.setAllColor({color});
    }
  }

  public get selectedGroupNames() {
    return this.pselectedGroupNames;
  }
  public set selectedGroupNames(v: string[]) {
    this.pselectedGroupNames = v;
    this.syncGroupSelection();
  }
  public syncGroupSelection() {
    const toSel: {[id: string]: boolean} = {};
    const lastSel = this.selectedGroupNames;
    for (const g of this.selectedGroupNames) {
      for (const f  of this.universe.groups[g]) {
        toSel[f] = true;
      }
    }
    const toSelL = Object.keys(toSel);
    this.selectedFixtureNames = toSelL;
  }
  public selectAll() {
    this.selectedFixtureNames = this.universe.fixtureList.map((e) => e.name);
  }
  public needDisplay(f: FixtureBase) {
    if (!this.showSelected) {return true; }
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
    if (gname) {
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
