<template>
  <div class="config">

  <Toggle text="autoSave" :value ="autoSave" @change="set__autoSave($event)"/>
  <Button text="save locally" @click="SAVE_LOCALLY"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';


// import ConfigMethods from '../store/config';
import Toggle from '../components/Toggle.vue';
import Button from '../components/Button.vue';
import Slider from '../components/Slider.vue';

const configModule = namespace('config');
import configFunctions from '../store/config'
@Component({
  components: {Toggle, Button, Slider },
})
export default class Config extends Vue {

  
  @configModule.Mutation('set__autoSave') public set__autoSave!:any;

  @configModule.State('autoSave') private autoSave!: boolean;
  @Action('SAVE_LOCALLY') SAVE_LOCALLY:any;
  // @configModule.State('fixtures') private fixtures!: ConfigMethods['fixtures'];




}
</script>

<style scoped>
  
</style>
