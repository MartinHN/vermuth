<template>
  <div class="config">

  <Toggle text="autoSave" :value ="autoSave" @change="set__autoSave($event)"/>
  <Button text="save locally"  @click="SAVE_LOCALLY"/>
  <label for="file">Load Locally</label>
  <input type="file" id="file" accept="application/json" text="load locally" @change="loadLocally($event.target.files)"/>
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
import configFunctions from '../store/config';
@Component({
  components: {Toggle, Button, Slider },
})
export default class Config extends Vue {


  @configModule.Mutation('set__autoSave') public set__autoSave!: any;
  @Action('SAVE_LOCALLY') public SAVE_LOCALLY: any;
  @Action('SET_SESSION_STATE') public SET_SESSION_STATE: any;

  @configModule.State('autoSave') private autoSave!: boolean;

  public loadLocally(files: FileList) {
    if (files && files.length === 1) {
      const file = files[0];
      const fileReader = new FileReader();
      fileReader.addEventListener('load', (event: any) => {
               this.SET_SESSION_STATE(JSON.parse(event.target.result));
          });
      fileReader.readAsText(file);


    }

  }
  // @configModule.State('fixtures') private fixtures!: ConfigMethods['fixtures'];




}
</script>

<style scoped>
  .config{
    min-height:100%;
  }
</style>
