<template>
  <div class="config">

  <Toggle text="autoSave" :value ="autoSave" @change="set__autoSave($event)"/>
  <Button text="save locally"  @click="SAVE_LOCALLY"/>
  <label for="file">Load Locally</label>
  <input type="file" id="file" accept="application/json" text="load locally" @change="loadLocally($event.target.files)"/>
  <Button text="clear session" color="red"  @click="clearSession"/>
  <Button text="panic (all to 0)" color="red"  @click="panic"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';


// import ConfigMethods from '../store/config';
import Toggle from '@/components/Inputs/Toggle.vue';
import Button from '@/components/Inputs/Button.vue';
import Slider from '@/components/Inputs/Slider.vue';

const configModule = namespace('config');
import configFunctions from '../store/config';
@Component({
  components: {Toggle, Button, Slider },
})
export default class Config extends Vue {


  @configModule.Mutation('set__autoSave') public set__autoSave!: any;
  @Action('SAVE_LOCALLY') public SAVE_LOCALLY: any;
  @Action('SET_SESSION_STATE') public SET_SESSION_STATE: any;
  @Action('SAVE_REMOTELY') public SAVE_REMOTELY: any;

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

  public clearSession() {
    const res = confirm('are you sure to delete all your session');
    if (res) {
      this.SET_SESSION_STATE({});
      this.SAVE_REMOTELY({});
    }
  }

  public panic() {

  }
  // @configModule.State('fixtures') private fixtures!: ConfigMethods['fixtures'];




}
</script>

<style scoped>
  .config{
    min-height:100%;
  }
</style>
