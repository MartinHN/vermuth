<template>
  <div class="config">
  <Toggle text="autoSave"/>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';


import ConfigMethods from '../store/config';
import Toggle from '../components/Toggle.vue';
import Button from '../components/Button.vue';
import Slider from '../components/Slider.vue';

const configModule = namespace('config');

@Component({
  components: {Toggle, Button, Slider },
})
export default class Config extends Vue {

  @configModule.Mutation('portlist') public addFixture!: ConfigMethods['portlist'];
  // @configModule.State('fixtures') private fixtures!: ConfigMethods['fixtures'];
  // @configModule.State('fixtures') private fixtures!: ConfigMethods['fixtures'];





}
</script>

<style scoped>
  
</style>
