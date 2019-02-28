<template>
  <div class="ServerState">
    <div ref="connectedState" :style='{"background-color":this.serverConnectionColor}'  >{{connectedState}}</div>
    <!-- <div ref="connectedId">{{connectedId}}</div> -->
    <select :style='{"background-color":this.portConnectionColor}' :value='displayedPort' @change="$store.dispatch('config/tryConnectPort',$event.target.value)">
      <option v-for="p of portlistAndNone" :value="p">{{p}}</option>
    </select>
    <select :value="selectedDriver" @change="$store.dispatch('config/tryConnectDriver',$event.target.value)">
      <option v-for="p of driverlist" :value="p">{{p}}</option>
    </select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
// var VueSlideBar :any = require( 'vue-slide-bar');
const configModule = namespace('config');

@Component({
  // components:{Toggle}
})
export default class Slider extends Vue {
  @State('connectedState') public connectedState!: string;
  // @State('connectedId') public connectedId!: number;
  @configModule.State('selectedPort') public selectedPort!: string;
  @configModule.State('portlist') public portlist!: any[];
  @configModule.State('selectedDriver') public selectedDriver!: string;
  @configModule.State('driverlist') public driverlist!: any[];
  @configModule.State('dmxIsConnected') public dmxIsConnected!:boolean;

  // @State('connectedId') public connectedId!:number;


  get serverConnectionColor(): string {
    if (this.connectedState === "connected") {
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
  get portlistAndNone():string[]{
    let res = this.portlist.map(p=>p.comName)
    res.splice(0,0,"no Port")
    return res

  }
  
  get displayedPort(){
    if(!this.selectedPort || (this.selectedPort==="none")){return "no Port"}
    else{return  this.selectedPort}
    
  }


}
</script>


<style scoped>
* {
  display : flex;
  flex-direction: column;
}
</style>