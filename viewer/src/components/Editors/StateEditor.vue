
<template>
  <div class="main" style="width:100%;height:100%">
    <div style="display:flex;flex-direction:row;width:100%">
      <v-row style="width:100%">
        <v-col cols="12">
          <v-list dense class="overflow-y-auto" style="max-height:200px">
            <v-list-item-group v-model="selectedFixtureIdxs" multiple>
              <v-list-item v-for="(s,i) in selectableFixtureListNames" :key="s.id">
                <v-list-item-content>
                  <v-list-item-title v-html="s"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-col>
      </v-row>
      <br />
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
    </div>
    <v-row>
      <v-col>
        <ChannelRack
          :displayableFixtureList="state?state.getSavedFixtureList(universe.fixtureAndGroupList):[]"
          :presetableState.sync="state.presetableState"
        />
        <div v-for="z of zombies" :key="z.id" >
        {{z}}
        </div>
      </v-col>
      <v-col cols="5">
        <MultiStateChooser :state="state" style="height:100px;with:100px"></MultiStateChooser>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Action, Getter, Mutation, namespace } from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import TextInput from '@/components/Inputs/TextInput.vue';
import ChannelRack from '@/components/ChannelRack.vue';
import FixtureWidget from '@/components/Widgets/FixtureWidget.vue';
import Modal from '@/components/Utils/Modal.vue';
import MultiStateChooser from '@/components/MultiStateChooser.vue';

import UniversesMethods from '../../store/universes';
import { FixtureBase } from '@API/Fixture';
import { State, StateList } from '@API/State';
import rootState from '@API/RootState';
import { FixtureFactory } from '@API/FixtureFactory';
import { ChannelRoles } from '@API/Channel';

const universesModule = namespace('universes');

@Component({
  components: {
    Button,
    MultiStateChooser,
    Numbox,
    Toggle,
    TextInput,
    FixtureWidget,
    ChannelRack,
  },
})
export default class StateEditor extends Vue {
  @Prop({ default: null, required: true })
  public state!: State | null;

  @Prop({ default: false })
  public readonly?: boolean;

  public selectedFixtureIdxs = new Array<number>();

  public showProps = false;
  public showValues = false;
  public showNames = false;

  @universesModule.State('universe')
  private universe!: UniversesMethods['universe'];

  private pselectedFixtureNames: string[] = [];
  private pselectedGroupNames: string[] = ['all'];
  private pselectedChannelFilterNames: string[] = ['all'];
  private extendedTypeFilter = false;

  private isLive = true;


  get selectedFixtures() {
    return this.universe.getFixtureListFromNames(this.selectedFixtureNames);
  }

  get selectedFixtureNames() {
    return this.selectedFixtureIdxs.map(
      (i) => this.selectableFixtureListNames[i],
    );
    // return this.selectedFixtures.map(e=>e.name);
  }
  get selectableFixtureListNames() {
    return this.selectableFixtures.map((e) => e.name);
  }

  get selectableFixtures() {
    return this.universe.sortedFixtureList;
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
    return this.universe.sortedFixtureList.filter(
      (f) =>
        this.needDisplay(f) &&
        f.hasChannelMatchingFilters(this.selectedChannelFilterNames),
    );
  }

  get selectableChannelFilterList() {
    const res: string[] = ['all'];

    for (const fam of Object.keys(ChannelRoles)) {
      res.push(fam);
      if (this.extendedTypeFilter) {
        for (const type of Object.keys(ChannelRoles[fam])) {
          res.push(fam + ':' + type);
        }
      }
    }
    return res;
  }

  public syncGroupSelection() {
    if (this.selectedGroupNames.length === 0) {
      return;
    }
    if (this.selectedGroupNames.find((e) => e === 'all')) {
      this.pselectedFixtureNames = this.selectableFixtureListNames;
      return;
    }
    const toSel: { [id: string]: boolean } = {};
    const lastSel = this.selectedGroupNames;
    for (const g of this.selectedGroupNames) {
      for (const f of this.universe.groups[g].fixtures) {
        toSel[f.name] = true;
      }
    }
    const toSelL = Object.keys(toSel);
    this.pselectedFixtureNames = toSelL;
  }

  public syncFilterSelection() {}

  public selectAll() {
    let i = -1;
    this.selectedFixtureIdxs = this.selectableFixtures.map((e) => {
      i++;
      return i;
    });
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

  public mounted() {
    if (this.state) {
      const resolvedFixtures = this.state.resolveState(
        this.universe.fixtureList,
        rootState.stateList.states,
        1,
      );
      for (const rf of Object.values(resolvedFixtures)) {
        const i = this.selectableFixtures.indexOf(rf.fixture);
        if (i >= 0 && this.selectedFixtureIdxs.indexOf(i) < 0) {
          this.selectedFixtureIdxs.push(i);
        }
      }
    }
  }

  get zombies(){
    if(this.state){
      const zObj =  this.state.findZombies()
      if(zObj && Object.keys(zObj).length){
        console.log( Object.keys(zObj))
        return zObj
      }
    }
    return ["no zombies found"]
  }
}
</script>


<style scoped>
</style>