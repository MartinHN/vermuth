<template>
  <div class="ChannelRackClass">
    <div style="display:flex;width:100%;padding:5px">
      <slider
        style="flex:1 0 75%"
        class="displayedMaster"
        @input="displayedMaster=$event"
        :value="displayedMaster"
        name="displayedMaster"
        showName="1"
        showValue="1"
      ></slider>
      <input type="color" @input="setAllColorHex($event.target.value)" />
    </div>
    <div style="display:flex;flex-direction:row;width:100%">
      <v-menu offset-y :close-on-content-click=false >
        <template v-slot:activator="{ on }">
          <v-btn color="primary" dark v-on="on">filters</v-btn>
        </template>
        <div style="background:black">
          <v-select
            label="fixtures"
            class="selectclass"
            multiple
            v-model="selectedFixtureNames"
            style="width:100%"
            :items="displayableFixtureNames"
          ></v-select>

          <v-select
            label="groups"
            multiple
            class="selectclass"
            v-model="selectedGroupNames"
            style="width:100%"
            :items="selectableGroupList"
          ></v-select>
          <v-select
            label="famillies"
            multiple
            class="selectclass"
            v-model="selectedChannelFilterNames"
            :items="selectableChannelFilterList"
          ></v-select>
          <Toggle v-model="extendedTypeFilter" text="extended Filters"></Toggle>
        </div>
      </v-menu>
      <div style="width:100%">
        <v-row no-gutters>
          <v-col cols="6">
            <v-menu offset-y :close-on-content-click="false" >
              <template v-slot:activator="{ on }">
                <v-btn color="primary" dark v-on="on">visibility</v-btn>
              </template>
              <div style="background:black">
                <Toggle v-model="showProps" text="show props"></Toggle>
                <Toggle v-model="showPresetable" text="show only presetable"></Toggle>
                <Toggle v-model="showActive" text="show only active"></Toggle>
              </div>
            </v-menu>
          </v-col>
          <v-col cols>
            <Button @click="disableAllPresetable()" text="disable All"></Button>
          </v-col>
        </v-row>

        <!--       <FixtureGroupWidget v-for="gN in displayedGroupNames" style="margin:10px 0 0 0;width:100%;background-color:#FFF5" :key="gN.id" :fixtureProps="fixturesForGroup(gN)" :groupName="gN" :showProps="showProps" :showName="showNames" ></FixtureGroupWidget>
        -->
      </div>
    </div>
    <FixtureGroupWidget
      v-for="f in displayedFixtures"
      style="margin:10px 0 0 0;width:100%;"
      class="channel"
      :key="f.id"
      :fixtureProp="f"
      :showName="showNames"
      :showValue="showValues"
      :filterList="selectedChannelFilterNames"
      :showProps="showProps"
    ></FixtureGroupWidget>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { rgbToHex, hexToRgb } from "@API/ColorUtils";
import FixtureWidget from "./Widgets/FixtureWidget.vue";
import FixtureGroupWidget from "./Widgets/FixtureGroupWidget.vue";

import Button from "@/components/Inputs/Button.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Slider from "@/components/Inputs/Slider.vue";

import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import { DirectFixture, FixtureBase, FixtureGroup } from "@API/Fixture";
import { ChannelRoles } from "@API/Channel";
import UniversesMethods from "../store/universes";
import StatesMethods from "../store/states";

const universesModule = namespace("universes");
const statesModule = namespace("states");

@Component({
  components: { FixtureWidget, Button, Toggle, Slider, FixtureGroupWidget }
})
export default class ChannelRack extends Vue {
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
    return (this.displayableFixtureList || []).map(e => e.name);
  }
  get selectableGroupList() {
    return ["all"].concat(this.universe.groupNames);
  }
  public get selectedGroupNames() {
    return this.pselectedGroupNames;
  }
  public set selectedGroupNames(v: string[]) {
    this.pselectedGroupNames = v;
  }

  set selectedChannelFilterNames(l: string[]) {
    this.pselectedChannelFilterNames = l;
  }
  get selectedChannelFilterNames() {
    return this.pselectedChannelFilterNames;
  }

  get displayedFixtures() {
    return (this.displayableFixtureList || []).filter(
      f =>
        this.needDisplay(f) &&
        f.hasChannelMatchingFilters(this.selectedChannelFilterNames)
    );
  }

  get displayedGroupNames() {
    return [];
    // return this.universe.groupNames;
  }

  get selectableChannelFilterList() {
    const res: string[] = ["all"];

    for (const fam of Object.keys(ChannelRoles)) {
      res.push(fam);
      if (this.extendedTypeFilter) {
        for (const type of Object.keys(ChannelRoles[fam])) {
          res.push(fam + ":" + type);
        }
      }
    }
    return res;
  }

  public get firstGroupSelected() {
    return this.selectedGroupNames.length > 0 ? this.selectedGroupNames[0] : "";
  }

  public set displayedMaster(v: number) {
    for (const f of this.displayedFixtures) {
      if (this.fixtureInPreset(f)) {
        f.setMaster(v);
      }
    }
  }
  public get displayedMaster() {
    return this.displayedFixtures.length
      ? this.displayedFixtures[0].dimmerValue
      : 0;
  }

  @Prop({ required: true })
  public displayableFixtureList!: FixtureBase[];

  public showNames = false;
  public showValues = true;
  public showProps = false;
  public showPresetable = false;
  public showActive = false;


  private pselectedFixtureNames: string[] = [];
  private pselectedGroupNames: string[] = ["all"];
  private pselectedChannelFilterNames: string[] = ["all"];
  private extendedTypeFilter = false;

  @universesModule.State("universe")
  private universe!: UniversesMethods["universe"];
  // @universesModule.Getter('grandMaster') private grandMaster!: UniversesMethods['grandMaster'];
  @universesModule.Mutation("setAllColor")
  private setAllColor!: UniversesMethods["setAllColor"];

  @statesModule.State("stateList")
  private stateList!: StatesMethods["stateList"];

  public fixturesForGroup(gN: string) {
    return this.universe.getFixturesInGroupNamed(gN);
  }
  public fixtureInPreset(f: FixtureBase) {
    return true;
  }

  public disableAllPresetable() {
    this.stateList.setPresetableNames([]);
  }

  public setAllColorHex(h: string) {
    const color = hexToRgb(h, true);
    if (color) {
      this.setAllColor({ color, setWhiteToZero: true });
    }
  }

  public selectAll() {
    this.selectedFixtureNames = this.displayableFixtureList.map(e => e.name);
  }

  public needDisplay(f: FixtureBase) {
    let needDisplay = true;
    if (this.showPresetable) {
      needDisplay =
        needDisplay &&
        (this.stateList.isPreseted(f) ||
          f.channels.some(c =>
            this.stateList.isPreseted(c)
          ));
    }
    if (this.showActive) {
      needDisplay = needDisplay && f.hasActiveChannels();
    }
    if (
      !(this.selectedFixtureNames && this.selectedFixtureNames.length === 0)
    ) {
      needDisplay =
        needDisplay &&
        this.selectedFixtureNames.find(fn => fn === f.name) !== undefined;
    }
    if (this.universe.getGroupsForFixture(f).length > 0) {
      needDisplay = false;
    }
    if (
      FixtureGroup.isFixtureGroup(f) &&
      !this.selectedGroupNames.includes("all")
    ) {
      needDisplay = needDisplay && this.selectedGroupNames.includes(f.name);
    }

    return needDisplay;
  }

  public get filterText() {
    return "filter";
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ChannelRackClass {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  background-color: gray;
}
.header {
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  background-color: darkgrey;
}
.channel {
  width: 100%;
}

/*.grandMaster{
  width:100%;
  }*/
/*.selectclass:focus {
    outline: none;
    }*/
</style>
