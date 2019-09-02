<template>
  <div class="ServerState">
    <div ref="connectedState" :style='{"background-color":this.serverConnectionColor}'  >{{connectedState}}, {{savedStatus}}</div>
    <!-- <div ref="connectedId">{{connectedId}}</div> -->
    <v-select :items=portListAndNone :style='{"background-color":this.portConnectionColor}' :value='displayedPort' @change="$store.dispatch('DMXConfig/tryConnectPort',$event)">
    </v-select>
    <v-select :items=driverList :value="selectedDriverName" @change="$store.dispatch('DMXConfig/tryConnectDriver',$event)">
    </v-select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import DMXClient from '../api/DMXClient';
// var VueSlideBar :any = require( 'vue-slide-bar');
const configModule = namespace('DMXConfig');

@Component({
  // components:{Toggle}
})
export default class ServerState extends Vue {
  @State('connectedState') public connectedState!: string;
  // @State('connectedId') public connectedId!: number;
  @configModule.Getter('selectedPortName') public selectedPortName!: string;
  @configModule.Getter('portList') public portList!: string[];
  @configModule.Getter('selectedDriverName') public selectedDriverName!: string;
  @configModule.Getter('driverList') public driverList!: string[];
  @configModule.Getter('dmxIsConnected') public dmxIsConnected!: boolean;
  @State('savedStatus') public savedStatus!: string;

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

  get portConnectionColor(): string {
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


}
</script>


<style scoped>
* {
  display : flex;
  flex-direction: column;
  min-width:100px;
}
</style>