<template>
  <v-container class="channelWidget" fluid pa-1>
    <div v-if="showProps" style="width:100%">
      <v-row no-gutters>
        <v-col>
          <Button @click="editCurve()" text="editCurve"></Button>
        </v-col>
        <v-col v-if="curveLink">
          <Button @click="deleteCurve()" text="-" color="red"></Button>
        </v-col>
      </v-row>
    </div>
    <div v-else style="width:100%">
      <v-row no-gutters>
        <v-col cols="2" v-if="showPresetableState">
          <Toggle v-model="enabledV" text="preset" />
        </v-col>
        <v-col>
          <slider
            class="slider"
            @input="updateChValue($event)"
            :value="channelProp.floatValue"
            :name="displayedName"
            :showName="true"
            :showValue="true"
            :enabled="enabledV && !isControlledExternally"
          ></slider>
        </v-col>
      </v-row>
    </div>

    <modal v-if="showCurveEditor" @close="showCurveEditor=0">
      <div style="position:relative;width:100%;height:100%" slot="body">
        <FullCurveEditor :curveLink="curveLink" :channel="channelProp" />
      </div>
    </modal>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapState, mapActions } from "vuex";
import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import Slider from "@/components/Inputs/Slider.vue";
import Button from "@/components/Inputs/Button.vue";
import Numbox from "@/components/Inputs/Numbox.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import FullCurveEditor from "@/components/Editors/FullCurveEditor.vue";
import { ChannelBase } from "@API/Channel";
import UniversesMethods from "@/store/universes";
import StatesMethods from "@/store/states";
import { Curve, CurveStore, CurveBaseI } from "@API/Curve";
import { CurvePlayer, CurveLink } from "@API/CurvePlayer";
import { uuidv4 } from "@API/Utils";

import { nextTick } from "@API/MemoryUtils";

const universesModule = namespace("universes");
const statesModule = namespace("states");

@Component({
  components: { Slider, Button, Numbox, Toggle, Modal, FullCurveEditor },
})
export default class ChannelWidget extends Vue {
  @Prop({ default: false })
  private showPresetableState!: boolean;

  @Prop({default:()=>{return {}}})
  presetable!:{value:number,preseted:boolean};

  get displayedName() {
    if (this.overrideName) {
      return this.overrideName;
    } else {
      return this.channelProp.name;
    }
  }

  get presetableName() {
    return this.channelProp.getUID();
  }
  updateChValue(v:number){
    
  this.setChannelValue({channel:this.channelProp,value:v,dontNotify:undefined})
   this.$emit("update:presetable", {preseted:true,value:v});
  }
  get enabledV(): boolean {
    return this.presetable.preseted;
    // debugger;
    // return this.stateList.isPreseted(this.channelProp);
  }

  set enabledV(v: boolean) {
    this.presetable.preseted = v
    // this.presetable = v;
    this.$emit("update:presetable",{preseted:v,value:this.channelProp.floatValue});
    
    // this.stateList.setNamePresetable(this.presetableName, v);
  }
  get sliderColor(): string {
    return this.enabledV ? "inherit" : "dark";
  }
  public get isControlledExternally() {
    return !!this.channelProp.externalController;
  }

  public get curveLink() {
    return CurvePlayer.getCurveLinkForChannel(this.channelProp);
    // return this.pcurveLink || this.getCurveLink()
  }

  @universesModule.Getter("usedChannels")
  public usedChannels!: UniversesMethods["usedChannels"];

  @universesModule.Mutation("setChannelValue")
  public setChannelValue!: UniversesMethods["setChannelValue"];
  @universesModule.Mutation("setChannelName")
  public setChannelName!: UniversesMethods["setChannelName"];

  @statesModule.State("stateList")
  public stateList!: StatesMethods["stateList"];

  @Prop() public channelProp!: ChannelBase;
  @Prop({ default: false }) public showName!: boolean;
  @Prop({ default: false }) public showValue!: boolean;
  @Prop({ default: false }) public showProps!: boolean;
  @Prop() public overrideName?: string;

  private showCurveEditor = false;
  public editCurve() {
    let curveLink = CurvePlayer.getCurveLinkForChannel(this.channelProp);
    if (!curveLink) {
      const curve = CurveStore.addNewCurve(this.channelProp.name, uuidv4());
      curveLink = CurvePlayer.createCurveLink(
        curve,
        this.channelProp,
        uuidv4()
      );
    }
    // this.pcurveLink = curveLink || null;
    nextTick(() => {
      this.showCurveEditor = true;
    });
  }

  public deleteCurve() {
    CurvePlayer.removeChannel(this.channelProp);
    // this.pcurveLink = null
  }

  public mounted() {
    // debugger
    // this._curve = CurvePlayer.getCurveForChannel(this.channelProp) || null;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.channelWidget {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: inherit;
  width: 100%;
}
.channelWidget .slider {
  flex-basis: 70%;
}
input {
  font-size: x-large;
}
</style>
