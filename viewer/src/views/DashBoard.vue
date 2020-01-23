<template>
  <div class="home">    
    <StateComponent />
    <ChannelRack v-if=allFixture :displayableFixtureList=allFixture />

  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import ChannelRack from '@/components/ChannelRack.vue'; // @ is an alias to /src
import StateComponent from  '@/components/StateComponent.vue';

import UniversesMethods from '../store/universes';
const universesModule = namespace('universes');
@Component({
  components: {
    ChannelRack,
    StateComponent,
  },
})
export default class Home extends Vue {

@universesModule.State('universe') private universe!: UniversesMethods['universe'];

  get allFixture() {
    return this.universe.sortedFixtureList;
  }

}
</script>
