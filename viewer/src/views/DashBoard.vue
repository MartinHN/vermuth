<template>
  <div class="home">    
  <v-row>
  <v-col cols=6>
    <StateComponent  />
  </v-col>
  <v-col>
    <ChannelRack v-if="allFixture" :displayableFixtureList="allFixture"  />
  </v-col>
  </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import ChannelRack from '@/components/ChannelRack.vue'; // @ is an alias to /src
import StateComponent from  '@/components/StateComponent.vue';
import { addProp } from "@API/MemoryUtils"
import UniversesMethods from '../store/universes';
const universesModule = namespace('universes');
@Component({
  components: {
    ChannelRack,
    StateComponent,
  },
})
export default class HDashboardome extends Vue {

@universesModule.State('universe') private universe!: UniversesMethods['universe'];

  get allFixture() {
    return this.universe.fixtureAndGroupList;
    // return this.universe.sortedFixtureList;
  }


}
</script>
