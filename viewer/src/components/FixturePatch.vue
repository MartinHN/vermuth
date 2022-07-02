<template>
  <div class="main">
    <v-container class="FixturePatch pa-0" fluid>
      <v-row no-gutters>
        <v-col cols="4" class="pa-0">
          <div>Fixtures</div>
          <Button
            class="button"
            @click="showFixtureExplorer=true"
            color="green"
            text="add Fixture"
            icon="plus lightbulb"
          />
          <Button text="remove Fixture" color="red" @click="askToRmFixtures()" icon="delete lightbulb" />
          <Modal v-if="showFixtureExplorer" @close="showFixtureExplorer=false">
            <!-- <h3 slot="header">fixture Explorer</h3> -->
            <FixtureExplorer slot="body" @change="addAndQuitFExplorer($event) "></FixtureExplorer>
          </Modal>
        </v-col>
        <v-col cols="4">
          <!-- <Button text="Manage Groups" @click="showGroupExplorer=true"/> -->
          <div>Groups</div>
          <Button text="addGroup" @click="addGroup()" color="green" icon="plus lightbulb-group"></Button>
          <Button text="removeGroup" @click="removeGroup()" color="red" icon="delete lightbulb-group"></Button>
          <!-- <Modal v-if="showGroupExplorer" @close="showGroupExplorer=false">
            <GroupExplorer  slot="body" ></GroupExplorer>
          </Modal>-->
        </v-col>

        <v-col cols="2" style="display:flex">
          <Numbox
            class="testNum"
            text="testChannel"
            showName="1"
            @input="!!$event && testDimmerNum($event)"
            :value="testDimmerNumVal"
          />
        </v-col>
      </v-row>
      <!-- <v-row  v-for="f in universe.sortedFixtureList" :key="f.name" style="background-color:#FFF5;margin:5px" no-gutters>
      -->
    </v-container>
    <v-card>
      <v-text-field
        v-model="searchFixtureText"
        ref="searchBar"
        append-icon="search"
        label="Search (Ctrl+f)"
        single-line
        hide-details
      ></v-text-field>

      <v-data-table
        :items="universe.sortedFixtureList"
        item-key="name"
        :headers="fixtureHeaders"
        :search="searchFixtureText"
        hide-default-footer
        :hide-default-header="false"
        disable-pagination
        :show-select="true"
        :mobile-breakpoint="0"
        v-model="selectedFixtures"
        dense
        @click.native="tableClicked"
      >
        <template v-slot:item.name="{item:f}">
          <TextInput
            :value="f.name"
            @change="setFixtureName({fixture:f,value:$event})"
          />
        </template>

        <template v-slot:item.baseCirc="{item:f}">
          <Numbox
            :errMsg="fixtureErrorMsgs[f.name]"
            class="baseCirc pa-0 ma-0"
            :value="f.baseCirc"
            :min="0"
            :max="512"
            @input="$event && setFixtureBaseCirc({fixture: f, circ:$event})"
            :postFix="`(${f.span})`"
          ></Numbox>
        </template>

        <template v-slot:item.groupNames="{item:f}">
          <v-lazy>
            <v-select
              hide-details
              multiple
              style="width:100%"
              :value="assignedGroupsOnFixture(f)"
              :items="universe.groupNames"
              @change="assignToGroups(f,$event)"
              class="pa-0"
            >
              <template v-slot:item="{item:item}">{{item}}</template>
            </v-select>
          </v-lazy>
        </template>

        <template v-slot:item.actions="{item:f}">
          <tr class="pa-0">
            <td>
              <Button
                text="edit"
                class="button pa-0 ma-0"
                @click="editedFixture = f"
                icon="pencil"
              />
            </td>
            <td>
              <Button text="clone" class="button pa-0 ma-0" @click="cloneFixture(f)" />
            </td>
            <td>
              <Toggle
                v-if="f.dimmerChannels && f.dimmerChannels.length "
                text="test"
                :value="universe.testedChannel.circ===f.dimmerChannels[0].trueCirc"
                @input="testDimmerNum($event?f.dimmerChannels[0].trueCirc:-1)"
              >T</Toggle>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>

    <Modal v-if="editedFixture!==null" @close="editedFixture=null">
      <h3 slot="header">fixture Editor</h3>
      <FixtureEditor slot="body" :fixture="editedFixture"></FixtureEditor>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import Numbox from "@/components/Inputs/Numbox.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import TextInput from "@/components/Inputs/TextInput.vue";
import Modal from "@/components/Utils/Modal.vue";
import FixtureEditor from "@/components/Editors/FixtureEditor.vue";
import FixtureExplorer from "@/components/Editors/FixtureExplorer.vue";
import GroupExplorer from "@/components/Editors/GroupExplorer.vue";
import { DirectFixture, FixtureBase } from "@API/Fixture";
import { FixtureFactory } from "@API/FixtureFactory";
import UniversesMethods from "../store/universes";
import { Universe } from "@API/Universe";

const universesModule = namespace("universes");

@Component({
  components: {
    Button,
    Numbox,
    Toggle,
    TextInput,
    Modal,
    FixtureEditor,
    FixtureExplorer,
    GroupExplorer
  }
})
export default class FixturePatch extends Vue {
  public get fixtureErrorMsgs() {
    // const dum = this.usedChannels
    const errs: { [id: string]: string } = {};
    const fl = this.universe.fixtureList;
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      const overlap = [];
      for (let j = i + 1; j < fl.length; j++) {
        const ff = fl[j];
        if (f !== ff) {
          const o =
            (f.baseCirc >= ff.baseCirc && f.baseCirc <= ff.endCirc) ||
            (f.endCirc >= ff.baseCirc && f.endCirc <= ff.endCirc);
          if (o) {
            overlap.push(ff.name);
          }
        }
      }
      if (overlap.length) {
        errs[f.name] = "overlap with " + overlap.join(",");
      }
    }
    return errs;
  }

  private tableClicked(ev: MouseEvent) {
    //@ts-ignore
    const el = ev.target as HTMLElement;
    const clickOnRow = el.className === "text-start"; //("text-start");
    console.log(clickOnRow, ev);
    if (clickOnRow) {
      const rowEl = el.parentElement;
      const listEl = rowEl?.parentElement;
      if(rowEl && listEl){
      const idx = Array.from(listEl.childNodes).indexOf(rowEl);
      if (idx >= 0 && idx < this.universe.sortedFixtureList.length) {
        this.selectedFixtures = [this.universe.sortedFixtureList[idx]];
      } else {
        console.warn("wrong list selection",idx);
      }
      }
    }
  }
  get fixtureColors() {
    const cols: { [id: string]: string } = {};
    for (const f of Object.values(this.universe.fixtures)) {
      cols[f.name] = this.fixtureErrorMsgs[f.name] ? "red" : "inherit";
    }
    return cols;
  }

  public selectedFixtures = new Array<FixtureBase>();

  get fixtureHeaders() {
    return [
      { text: "Name", value: "name" },
      { text: "Dimmer", value: "baseCirc" },
      { text: "Group", value: "groupNames", filterable: true },
      { text: "Actions", value: "actions", sortable: false, filterable: false }
      // ,{text:"edit",sortable:false},{text:"test",sortable:false}
    ];
  }

  public editedFixture = null;
  @universesModule.Mutation("addFixture")
  public addFixture!: UniversesMethods["addFixture"];
  @universesModule.Mutation("duplicateFixture")
  public duplicateFixture!: UniversesMethods["duplicateFixture"];

  @universesModule.Mutation("setFixtureBaseCirc")
  public setFixtureBaseCirc!: UniversesMethods["setFixtureBaseCirc"];

  @universesModule.Mutation("linkChannelToCirc")
  public linkChannelToCirc!: UniversesMethods["linkChannelToCirc"];
  @universesModule.Mutation("setChannelName")
  public setChannelName!: UniversesMethods["setChannelName"];
  @universesModule.Mutation("removeChannel")
  public removeChannel!: UniversesMethods["removeChannel"];

  @universesModule.Mutation("removeFixture")
  public removeFixture!: UniversesMethods["removeFixture"];
  @universesModule.Mutation("setFixtureName")
  public setFixtureName!: UniversesMethods["setFixtureName"];

  @universesModule.Getter("testDimmerNumVal")
  public testDimmerNumVal!: UniversesMethods["testDimmerNumVal"];
  @universesModule.Mutation("testDimmerNum")
  public testDimmerNum!: UniversesMethods["testDimmerNum"];

  @universesModule.State("universe")
  private universe!: Universe;

  @universesModule.Getter("usedChannels")
  private usedChannels!: UniversesMethods["usedChannels"];

  private searchFixtureText = "";
  private showFixtureExplorer = false;

  private showGroupExplorer = false;
  public mounted() {
    window.addEventListener("keydown", this.processKey);
  }
  public activated() {
    window.addEventListener("keydown", this.processKey);
  }

  public deactivated() {
    window.removeEventListener("keydown", this.processKey);
  }
  public destroyed() {
    window.removeEventListener("keydown", this.processKey);
  }
  public cloneFixture(f: FixtureBase) {
    const c = f.clone(1);
  }
  public addAndQuitFExplorer(e: FixtureBase) {
    this.showFixtureExplorer = false;
    if (e) {
      const numFixture = parseInt(
        prompt("how much do you want to add", "1") || "0",
        10
      );
      if(numFixture<=0) return;
      const baseAddr = parseInt(
        prompt("starting dimmer number", "1") || "1",
        10
      );
      const name = prompt("name of the fixture?", e.fixtureType);
      if (name) {
        const eObj = JSON.parse(JSON.stringify(e))
        eObj.name = name;
        eObj._baseCirc = baseAddr;
        this.universe.addFixture(eObj);
        
        for (let i = 1; i < numFixture; i++) {
          eObj._baseCirc+=e.span
          this.universe.addFixture(eObj);
        }
      }
    }
  }

  public open() {
    // debugger
  }
  public close() {
    debugger;
  }

  public assignToGroups(f: FixtureBase, event: string[]) {
    const fixtureList = this.selectedFixtures.includes(f)
      ? this.selectedFixtures
      : [f];
    fixtureList.map(ff => {
      this.universe.setGroupNamesForFixture(ff, event);
      // debugger;
    });
  }

  public assignedGroupsOnFixture(f: FixtureBase): string[] {
    // debugger
    return this.universe.getGroupNamesForFixture(f);
  }
  public addGroup() {
    const gname = prompt("save new group", "group");
    if (gname) {
      this.universe.addGroup(gname);
    }
  }
  public removeGroup() {
    const gname = prompt("remove group", "");
    if (gname && gname !== "all") {
      this.universe.removeGroupNamed(gname);
    }
  }

  private askToRmFixtures(fBase: FixtureBase) {
    const fl = (this.selectedFixtures.includes(fBase) || !fBase)
      ? this.selectedFixtures
      : [fBase];
    if (
      window.confirm(`areYouSure to DELETE fixture ${fl.map(f => f?.name)}`)
    ) {
      fl.map(f => this.removeFixture({ fixture: f }));
    }
  }

  private processKey(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();

      switch (key) {
        case "f":
          event.preventDefault();
          (this.$refs.searchBar as HTMLElement).focus();

          break;

        case "g":
          // event.preventDefault();
          // alert('ctrl-g');
          break;
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>
.box {
  box-shadow: 0 0 4pt rgba(0, 0, 0, 0.25);
  border-radius: 20pt;
  background-color: rgba(255, 255, 255, 0.25);
  user-select: none;
  cursor: context-menu;
}
</style>
