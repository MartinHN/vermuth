<template>
  <v-container class="ActionComponent pa-0">
    <v-row>
      <v-col cols="6">
        <div v-for="(i, e) of atype.inputCaps" :key="e.id">
          <div
            :is="inputComponents[e]"
            v-model="action.inputs[e]"
            v-bind="currentInputProps"
            :text="e"
            style="width: 100%; height: 100%; minheight: 40px"
          ></div>
        </div>
      </v-col>
      <v-col>
        <div v-if="action.hasInternalState()">
          <Button @click="showEditState = true" icon="pencil" />
          <Modal v-if="showEditState" @close="showEditState = false">
            <div
              slot="body"
              :is="editStateComponentAndProps.component"
              v-bind="editStateComponentAndProps.props"
              v-bind:[editStateComponentAndProps.sync[0]].sync="
                editStateComponentAndProps.sync[1]
              "
            ></div>
          </Modal>
        </div>
        <div v-else>
          <v-select
            :value="(action.targets || []).map((t) => t.get().name)"
            :items="availableTargetNames"
            multiple
            @change="setTargetNames"
          ></v-select>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { mapState, mapActions } from "vuex";
import { Action, Getter, Mutation, namespace } from "vuex-class";
import Slider from "@/components/Inputs/Slider.vue";
import Button from "@/components/Inputs/Button.vue";
import Numbox from "@/components/Inputs/Numbox.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import FullCurveEditor from "@/components/Editors/FullCurveEditor.vue";
// import ColorPicker from "@/components/Inputs/ColorPicker.vue";
import { ChannelBase } from "@API/Channel";
import UniversesMethods from "@/store/universes";
import StatesMethods from "@/store/states";
import { Curve, CurveStore, CurveBaseI } from "@API/Curve";
import { CurvePlayer, CurveLink } from "@API/CurvePlayer";
import { uuidv4 } from "@API/Utils";

import { nextTick } from "@API/MemoryUtils";
import {
  ActionFactory,
  ActionInstance,
  InputCapType,
  TargetCapType,
} from "@API/Actions";
import rootState from "@API/RootState";
import ColorPicker from "@/components/Inputs/ColorPicker.vue";
import { buildAddressFromObj } from "@API/ServerSync";
import ChannelRack from "@/components/ChannelRack.vue";
const universesModule = namespace("universes");
const statesModule = namespace("states");

@Component({
  components: {
    Slider,
    Button,
    Numbox,
    Toggle,
    Modal,
    FullCurveEditor,
  },
})
export default class ActionComponent extends Vue {
  @Prop({ required: true })
  public action!: ActionInstance;
  public showEditState = false;
  get inputComponents() {
    const res: { [id: string]: any } = {};
    Object.entries(this.atype.inputCaps).map((v) => {
      const name = v[0];
      const type = v[1];
      if (type === InputCapType.Number) {
        res[name] = Slider;
      } else if (type === InputCapType.Color) {
        res[name] = ColorPicker;
      } else if (type === InputCapType.Boolean) {
        res[name] = Toggle;
      }
    });
    return res;
  }

  get currentInputProps() {
    return { mini: true, RGBW: this.shouldBeRGBW };
  }
  get shouldBeRGBW() {
    return this.action.inputs["setWhiteToZero"] ? false : true;
  }
  get atype() {
    return this.action.getATYPE();
  }
  apply() {
    this.action.apply();
  }

  changeInputs(n: string, i: any) {
    // debugger
    this.action.inputs[n] = Object.assign({}, i);
  }
  @Watch("action")
  notif() {
    console.log("internal action changed");
  }
  get editStateComponentAndProps() {
    if (this.showEditState) {
      if (this.atype.atype === "setFixture") {
        return {
          component: ChannelRack,
          props: {
            displayableFixtureList: rootState.universe.fixtureList,
            showPresetableState: true,
          },
          sync: ["presetableState", this.action.internalState],
        };
      }
    }
    return { component: undefined, props: {} };
  }
  get availableTargets() {
    const outCap = this.atype.targetCaps;
    let originT = null;
    if (outCap === TargetCapType.FixtureBase) {
      originT = rootState.universe.fixtureList;
    }
    if (outCap === TargetCapType.Sequence) {
      originT = Object.values(rootState.sequenceList.listGetter);
    }
    if (outCap === TargetCapType.State) {
      originT = Object.values(rootState.stateList.states);
    }
    if (outCap === TargetCapType.ChannelBase) {
      originT = rootState.universe.allChannels;
    }
    if (originT) {
      return this.action?.filterTarget(originT);
    }
    return [];
  }

  get availableTargetNames() {
    return this.availableTargets?.map((t) => t.name);
  }
  setTargetNames(ns: string[]) {
    const addrL = this.availableTargets
      ?.filter((f) => ns.includes(f.name))
      .map((f) => buildAddressFromObj(f, true));
    if (addrL) {
      this.action.targets.setFromList(addrL);
      this.action.apply();
    }
  }
  public mounted() {
    // debugger
    // this._curve = CurvePlayer.getCurveForChannel(this.channelProp) || null;
  }
  get inputs() {
    return Object.entries(this.action.inputs || {});
  }

  get availableTypes() {
    return ActionFactory.actionNames;
  }
  changeType() {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
