
<template>
  <div class="main" style="width: 100%; height: 100%; text-align: left">
    <!-- 
    <v-row no-gutters>
      <v-col cols=4>
        <Button text="addGroup" @click="addGroup()" color="green"></Button>
      <Button text="removeGroup" @click="removeGroup()" color="red"></Button>
        <v-list style="max-height: 400px" class="overflow-y-auto" dense >
          <v-list-item-group  v-model="selectedGroupIdx" mandatory>
            <v-list-item v-for="(gN, i) in displayedGroups" :key="i" dense >
              {{gN}}
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>

      
      <v-col cols=6>
        <v-list style="max-height: 400px" class="overflow-y-auto" dense >
          <v-list-item-group  v-model="selectedFixtureIdxs" multiple>
            <v-list-item v-for="(gN, i) in displayedFixture" :key="i" dense >
              {{gN}}
            </v-list-item>
          </v-list-item-group>
        </v-list>

      </v-col>



    </v-row>


 -->
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
  components: { Button, Numbox, Toggle },
})
export default class GroupExplorer extends Vue {
  // @universesModule.State('universe') private universe!: UniversesMethods['universe'];
  // private pselectedGroupIdx = 0
  // get selectedGroupIdx(){return this.pselectedGroupIdx}
  // set  selectedGroupIdx(v:number){ this.showGroup = v}
  // get displayedGroups(){
  //   return this.universe.groupNames
  // }
  // get displayedFixtures(){
  //   return this.universe.fixtureList
  // }
  // set selectedFixtureIdxs(v:number[]){
  // }
}
</script>


<style scoped>
</style>
