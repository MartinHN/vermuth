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
      <v-menu offset-y :close-on-content-click="false">
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
            <v-menu offset-y :close-on-content-click="false">
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
            <Button
              v-if="showPresetableState"
              @click="disableAllPresetable()"
              style="height:100%"
              text="disable All"
            ></Button>
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
      :showPresetableState="showPresetableState"
      :presetableState.sync="lazyPresetableState[f.name]"
    ></FixtureGroupWidget>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { rgbToHex, hexToRgb } from "@API/ColorUtils";
import FixtureWidget from "./Widgets/FixtureWidget.vue";
import FixtureGroupWidget from "./Widgets/FixtureGroupWidget.vue";

import Button from "@/components/Inputs/Button.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Slider from "@/components/Inputs/Slider.vue";

import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import { DirectFixture, FixtureBase, FixtureGroup } from "@API/Fixture";
import { FixtureState } from "@API/State";
import { ChannelRoles } from "@API/Channel";
import rootState from "@API/RootState";
import UniversesMethods from "../store/universes";
import StatesMethods from "../store/states";
import { addProp } from "@API/MemoryUtils";

const universesModule = namespace("universes");
const statesModule = namespace("states");
// const dumbState = {};
// function createDefaultState(rootObj){

//       function createFakeChild(o: any, n: any, depth: number) {
//         if (typeof n === "string" && !n.startsWith("_") && !(["state","toJSON","constructor","render"].includes(n))) {
//           // debugger;
//           if (!Object.keys(o).includes(n)) {
//             addProp(
//               o,
//               n,
//               depth == 2
//                 ? { preseted: false, value: 0 }
//                 : new Proxy(
//                     {},
//                     {
//                       get(o, k) {
//                         return createFakeChild(o, k, depth + 1);
//                       }
//                     }
//                   )
//             );
//           }
//         }
//         return o[n];
//       }
//       return new Proxy(rootObj, {
//         get(o, k) {
//           return createFakeChild(rootObj, k, 0);
//         }
//       });

// }
@Component({
  components: { FixtureWidget, Button, Toggle, Slider, FixtureGroupWidget }
})
export default class ChannelRack extends Vue {
  dumbState = {};
  @Prop({ default: undefined })
  presetableState!: {
    [id: string]: { [id: string]: { preseted: boolean; value: number } };
  };

  mounted() {}

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
  get hasPresetableState() {
    debugger;
    return this.presetableState !== undefined;
  }
  get lazyPresetableState() {
    debugger;
    if (this.hasPresetableState) {
      return this.presetableState;
    }
    const isValidAsNew = (k: string | symbol | number, o: any) => {
      return (
        !(typeof k === "symbol") &&
        !(k in Object.keys(o)) &&
        !k.toString().startsWith("_") &&
        !["state", "toJSON", "constructor", "render"].includes(k.toString())
      );
    };
    return new Proxy(
      {},
      {
        get(o, k, thisProxy) {
          // debugger;
          if (isValidAsNew(k, o)) {
            const chDic: {
              [id: string]: { v: number; presetable: boolean };
            } = {};
            const lazyChannelDic = new Proxy(chDic, {
              get(oo, kk, thisProxy) {
                // debugger
                if (isValidAsNew(kk, oo)) {
                  Vue.set(oo, kk.toString(), { v: 0, presetable: false });
                }
                return Reflect.get(oo, kk, thisProxy);
              }
            });
            Vue.set(o, k.toString(), lazyChannelDic);
          }
          return Reflect.get(o, k, thisProxy);
        }
      }
    );
  }
  set lazyPresetableState(v: any) {
    debugger;
    console.error("cant set lazy!!!");
  }
  @Watch("presetableState")
  notif() {
    debugger;
    console.log("displayableFixture changed");
    this.$emit("presetable", this.presetableState);
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

  @Prop({
    default: () => {
      return rootState.universe.fixtureAndGroupList;
    }
  })
  public displayableFixtureList!: FixtureBase[];

  @Prop()
  public showPresetableState?: boolean;

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
    if (this.hasPresetableState) {
      let insp = this.presetableState;
      for (const v of Object.values(insp)) {
        for (const l of Object.values(v)) {
          if (l.preseted) {
            l.preseted = false;
          }
        }
      }
      // this.$emit("presetableState:update",{});
    }
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
          f.channels.some(c => this.stateList.isPreseted(c)));
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
