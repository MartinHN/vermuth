<template>

  <v-container class="channelWidget" fluid pa-1>

    <div v-if=showProps style="width:100%">
      <v-row no-gutters>
        
        <v-col >
          <Button @click="setCurve()" text=setCurve></Button>
        </v-col>
        <v-col v-if="curve" >
          <Button  @click="deleteCurve()" text=- color=red></Button>
        </v-col>
      </v-row>
    </div>
    <div v-else style="width:100%">
      <v-row no-gutters>
      <v-col cols=2 >
          <Toggle v-model="enabledV" text="enabled"/>
        </v-col>
        <v-col>
      <slider class="slider" @input="setChannelValue({channel:channelProp,value:$event})" :value="channelProp.floatValue" :name="displayedName"  :showName="true" :showValue="true" :enabled="enabledV && !isControlledExternally"></slider>
</v-col>
</v-row>
      
    </div>
    
    
    <modal v-if=showCurveEditor @close="showCurveEditor=0">
      <div style="position:relative;width:100%;height:100%" slot=body>
        <CurveEditor :curve="curve" isZoomable=1 />
        <Numbox text="offset" v-model=curveOffset></Numbox>
      </div>
    </modal>
  </v-container>


</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from '@/components/Inputs/Slider.vue';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue';
import CurveEditor from '@/components/Editors/CurveEditor.vue';
import { ChannelBase } from '@API/Channel';
import UniversesMethods from '../store/universes';
import {Curve, CurveBase} from '@API/Curve';
import {CurvePlayer} from '@API/CurvePlayer';



const universesModule = namespace('universes');

@Component({
  components: {Slider, Button, Numbox, Toggle, Modal, CurveEditor},
})
export default class ChannelWidget extends Vue {

  get displayedName() {
    if ( this.overrideName) {return this.overrideName; } else {return this.channelProp.name; }
  }
  get enabledV(): boolean {return this.channelProp.enabled; }
  set enabledV(v: boolean) {this.setChannelEnabled({channel: this.channelProp, value: v}); }
  get sliderColor(): string {
    return this.enabledV ? 'inherit' : 'dark';
  }

  @universesModule.Getter('usedChannels') public usedChannels!: UniversesMethods['usedChannels'];
  @universesModule.Mutation('setChannelValue') public setChannelValue!: UniversesMethods['setChannelValue'];
  @universesModule.Mutation('setChannelName') public setChannelName!: UniversesMethods['setChannelName'];
  @universesModule.Mutation('setChannelEnabled') public setChannelEnabled!: UniversesMethods['setChannelEnabled'];

  @Prop() public channelProp!: ChannelBase;
  @Prop({default: false})    public showName!: boolean;
  @Prop({default: false})    public showValue!: boolean;
  @Prop({default: false}) public showProps!: boolean;
  @Prop() public overrideName?: string;
  public _curve: CurveBase|null = null;
  private showCurveEditor = false;
  public setCurve() {
    debugger;
    let curve = CurvePlayer.getCurveForChannel(this.channelProp);
    if (!curve) {
      curve = new Curve<number>(this.channelProp.name);
      CurvePlayer.addCurve(curve);
      CurvePlayer.assignChannelToCurveNamed(curve.name, this.channelProp, 0);
    }
    // this._curve = curve || null;
    this.showCurveEditor = true;
  }

  public deleteCurve() {
    CurvePlayer.removeChannel(this.channelProp);

  }
  public get isControlledExternally() {
    return  this.channelProp.externalController !== null;
  }
  public set curveOffset(v: number) {
    const cl = CurvePlayer.getCurveLinkForChannel(this.channelProp);
    if (cl) {cl.offset = v; }
  }
  public get curveOffset() {
    const cl = CurvePlayer.getCurveLinkForChannel(this.channelProp);
    return cl ? cl.offset : 0;
  }
  public mounted() {
    // debugger
    // this._curve = CurvePlayer.getCurveForChannel(this.channelProp) || null;
  }
  public get curve() {
    return this.channelProp.externalController;
    // this._curve = CurvePlayer.getCurveForChannel(this.channelProp) || null
    // return this._curve
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.channelWidget {
  display: flex;
  justify-content: space-around;
  align-items: center;
  /*background-color: gray;*/
  width:100%;

}
.channelWidget .slider {
  flex-basis:70%;
}
input{
  font-size: x-large;
}
</style>
