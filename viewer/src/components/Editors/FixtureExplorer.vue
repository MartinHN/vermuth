
<template>
  <div class="main" style="width: 100%; height: 100%; text-align: left">
    <!-- <div v-if='fixture!==null'> -->
    <v-row no-gutters style="height: 10%; flex-wrap: nowrap">
      <v-select
        label="manufacturer"
        v-model="selectedFixtureManufacturer"
        :items="fixtureManufacturers"
        dense
        dark
        filled
      ></v-select>

      <v-select
        label="category"
        v-model="selectedFixtureCategory"
        :items="fixtureCategoriesByManufacture"
        dense
        filled
      ></v-select>
    </v-row>
    <v-row style="height: 100%">
      <v-col cols="4" style="height: 100%">
        <v-list style="max-height: 100%" class="overflow-y-auto" dense>
          <v-list-item-group v-model="selectedFixtureDefIdx" mandatory>
            <v-list-item
              v-for="(fN, i) in filteredFixtureNames"
              :key="i"
              dense
              >{{ fN }}</v-list-item
            >
          </v-list-item-group>
        </v-list>
      </v-col>

      <v-col
        cols="8"
        v-if="selectedFixtureDef"
        style="height: 100%; overflow-y: auto"
      >
        <v-select
          :disabled="Object.keys(selectedFixtureDef.modes).length <= 1"
          label="DMX mode"
          class="selectclass"
          v-model="selectedMode"
          style="width: 50%; display: inline-block"
          :items="Object.keys(selectedFixtureDef.modes)"
          dense
          filled
        ></v-select>
        <Button
          @click="$emit('change', selectedFixtureInstance)"
          text="add"
          color="green"
          style="width: 50%; display: inline-block"
        ></Button>

        <FixtureEditor
          :readonly="true"
          :fixture="selectedFixtureInstance"
        ></FixtureEditor>
      </v-col>
    </v-row>

    <!-- </div> -->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import Numbox from "@/components/Inputs/Numbox.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import FixtureEditor from "@/components/Editors/FixtureEditor.vue";
import UniversesMethods from "../../store/universes";
import { FixtureBase } from "@API/Fixture";
import { FixtureFactory, FixtureDef } from "@API/FixtureFactory";
const universesModule = namespace("universes");

@Component({
  components: { Button, Numbox, Toggle, FixtureEditor },
})
export default class FixtureExplorer extends Vue {
  get selectedMode() {
    const aM = Object.keys(this.selectedFixtureDef.modes);
    if (aM.indexOf(this.pselectedMode) >= 0) {
      return this.pselectedMode;
    }
    return aM[0];
  }
  set selectedMode(v: string) {
    this.pselectedMode = v;
  }

  get fixtureManufacturers() {
    return ["All"].concat(
      Object.keys(FixtureFactory.allFixturesByManufacturers)
    );
  }

  get filteredByManufacturer() {
    let filtered = FixtureFactory.allFixtureDefsFlatList;
    const manuFilter = this.selectedFixtureManufacturer;
    if (manuFilter !== "All") {
      filtered = filtered.filter((e) => e.manufacturer === manuFilter);
    }
    return filtered;
  }

  get fixtureCategoriesByManufacture() {
    const res = new Set<string>();
    this.filteredByManufacturer.map((f) => {
      f.categories.map((c) => res.add(c));
    });

    return ["All"].concat(Array.from(res));
    // return FixtureFactory.getAllFixtureDefsCategories()
  }

  get filteredFixtureDefs() {
    let filtered = this.filteredByManufacturer;
    if (this.selectedFixtureCategory !== "All") {
      const cl = [this.selectedFixtureCategory];
      filtered = filtered.filter((e) =>
        cl.every((elem) => e.categories.indexOf(elem) > -1)
      );
    }
    filtered.sort((a, b) => {
      const keyA = a.name;
      const keyB = b.name;
      // Compare the 2 dates
      if (keyA < keyB) {
        return -1;
      }
      if (keyA > keyB) {
        return 1;
      }
      return 0;
    });
    return filtered;
  }

  get filteredFixtureNames() {
    return this.filteredFixtureDefs.map((e) => e.name).sort();
  }
  get selectedFixtureDef() {
    const fd = this.filteredFixtureDefs[this.selectedFixtureDefIdx];
    return fd;
  }

  get selectedFixtureInstance() {
    const fd = this.selectedFixtureDef;
    if (fd) {
      if (
        fd !== this._lastSelectedFixtureDef ||
        this._lastSelectedMode !== this.pselectedMode
      ) {
        this._lastSelectedFixtureDef = fd;
        this._lastSelectedMode = this.pselectedMode;
        this._lastGeneratedFixtureDef = fd.generateFixture(
          "test",
          this.pselectedMode
        );
      }
      return this._lastGeneratedFixtureDef;
    }
    return null;
  }

  get fixtureTypes() {
    return FixtureFactory.getAllFixtureDefsTypeNames();
  }

  // categoryFilter = new Array<string>()
  public selectedFixtureDefIdx = 0;

  public selectedFixtureCategory = "All";
  public selectedFixtureManufacturer = "unknown";
  public pselectedMode = "default";

  @Prop({ default: null })
  public value: any;

  private _lastSelectedFixtureDef: any;
  private _lastSelectedMode: any;
  private _lastGeneratedFixtureDef: any;
  public mounted() {}
}
</script>


<style scoped>
</style>
