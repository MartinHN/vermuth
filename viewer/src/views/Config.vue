<template>
  <div class="config">

  <Button text="save locally"  @click="SAVE_LOCALLY"/>
  <label for="file">Load Locally (Ctrl+O)</label>
  <input class="configElement"  type="file" id="file" accept="application/json" text="load locally" @change="loadLocally($event.target.files)"/>
  <Button class="configElement"  text="clear session" color="red"  @click="clearSession"/>
  <Button text="panic (all to 0)" color="red"  @click="panic"/>
  <Button text="try other ip than default" @click="alertTryIP"/>
  <Button text="go to Backups" @click="goToBackups"/>
  <Button text="log Accessible Tree" @click="logTree"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';


// import ConfigMethods from '../store/config';
import Toggle from '@/components/Inputs/Toggle.vue';
import Button from '@/components/Inputs/Button.vue';
import Slider from '@/components/Inputs/Slider.vue';
import rootState from "@API/RootState"


const configModule = namespace('config');
import configFunctions from '../store/config';

const DMXConfigModule = namespace('DMXConfig');
import DMXConfigMethods from '../store/DMXConfig';
@Component({
  components: {Toggle, Button, Slider },
})
export default class Config extends Vue {


  @Action('SAVE_LOCALLY') public SAVE_LOCALLY: any;
  @Action('SET_SESSION_STATE') public SET_SESSION_STATE: any;
  @Action('SAVE_REMOTELY') public SAVE_REMOTELY: any;



  @DMXConfigModule.Mutation('tryIP') private tryIP!: DMXConfigMethods['tryIP'];

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

  public logTree(){
    rootState.logTree();
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

  public alertTryIP() {
    const res = prompt('change Server IP');
    if (res) {
      this.tryIP(res);
    }
  }

  public goToBackups() {
    const loc = window.location;
    let bkLocation = loc.origin;
    if (loc.port === '8081') {
      bkLocation = loc.protocol + '//' + loc.hostname + ':3000/backups';
    }
    window.open(bkLocation);

  }

  // @configModule.State('fixtures') private fixtures!: ConfigMethods['fixtures'];




}
</script>

<style scoped>
  .config{
    min-height:100%;
  }
  .config *{
    padding: 20px;
    margin: 5px;
  }
</style>
