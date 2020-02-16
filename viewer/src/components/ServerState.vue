<template>
  <v-row no-gutters class="ServerState">

    <v-col cols=2>
    <div ref="connectedState" :style='{"background-color":this.serverConnectionColor,"width":"100%"}'  >{{connectedState}}<br>{{savedStatus}}<br>{{serverIP}}</div>
  </v-col>
      <!-- <div ref="connectedId">{{connectedId}}</div> -->
      <v-col cols=2>
        <Button style="width:100%;height:100%" text="Save" @click="SAVE_SESSION()"></Button>
      </v-col>
      <v-col >
        <v-select label=driver :items=driverList :value="selectedDriverName" :style='{"background-color":this.dmxConnectionColor}' @change="$store.dispatch('DMXConfig/tryConnectDriver',$event)" hide-details>
        </v-select>
      </v-col>
      <v-col >
        <v-select label=serialport v-if="displaySerialPort" :items=portListAndNone :style='{"background-color":this.dmxConnectionColor}' :value='displayedPort' @change="$store.dispatch('DMXConfig/tryConnectPort',$event)" hide-details>
        </v-select>
      </v-col>
    </v-row>
  </template>

  <script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import DMXClient from '../api/DMXClient';
// import GlobalMethods from '../store';
import { needSerialPort } from '@API/DMXControllerI';
import Button from '@/components/Inputs/Button.vue';
// var VueSlideBar :any = require( 'vue-slide-bar');
const configModule = namespace('DMXConfig');

@Component({
  components: { Button },
})
export default class ServerState extends Vue {
  @State('connectedState') public connectedState!: string;
  // @State('connectedId') public connectedId!: number;
  @configModule.Getter('selectedPortName') public selectedPortName!: string;
  @configModule.Getter('__portNameList') public portList!: string[];
  @configModule.Getter('selectedDriverName') public selectedDriverName!: string;
  @configModule.Getter('__driverNameList') public driverList!: string[];
  @configModule.Getter('dmxIsConnected') public dmxIsConnected!: boolean;
  @configModule.State('serverIP') public serverIP!: string;
  @State('savedStatus') public savedStatus!: string;
  @Action('SAVE_SESSION') public SAVE_SESSION!: () => void;

  // @State('connectedId') public connectedId!:number;


  get client() {
    return DMXClient;
  }
  get serverConnectionColor(): string {
    if (this.connectedState === 'connected') {
      return 'green';
    }
    return 'red';
  }

  get dmxConnectionColor(): string {
    if (this.dmxIsConnected ) {
      return 'green';
    }
    return 'red';
  }
  get portListAndNone(): string[] {
    let res: string[] = [];
    if (this.portList) {
      res = this.portList.slice();
    }// .map((p) => p.comName);
    res.splice(0, 0, 'no Port');
    return res;

  }

  get displayedPort() {
    if (!this.selectedPortName || (this.selectedPortName === 'none')) {return 'no Port'; } else {return  this.selectedPortName; }

  }

  get displaySerialPort() {
    return needSerialPort(this.selectedDriverName);
  }


}
</script>


<style scoped>

</style>