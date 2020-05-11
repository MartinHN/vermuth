<template>
  <v-container class="ActionList" pa-1>
    <v-menu text="add" icon="plus" @change="addAction">
      <template v-slot:activator="{ on }">
        <v-btn color="primary" dark v-on="on">Add Action</v-btn>
      </template>
      <v-list style="width:100%">
        <v-list-item v-for="i in availableTypes" :key="i.id" @click="addAction(i)">{{i}}</v-list-item>
      </v-list>
    </v-menu>
    <draggable style="width:100%" handle=".handle">
      <v-row v-for="a of actions.list" :key="a.id" style="width:100%">
        <v-icon class="handle" style="width:10%">mdi-{{getIcon(a)}}</v-icon>
        <ActionComponent style="width:90%" :action="a"></ActionComponent>
      </v-row>
    </draggable>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { mapState, mapActions } from "vuex";
import {  Getter, Mutation, namespace } from "vuex-class";
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
import { ActionFactory ,ActionList,ActionInstance} from "@API/Actions";
import ActionComponent from "./ActionComponent.vue";
import { State } from "@API/State";
import draggable from "vuedraggable";
const universesModule = namespace("universes");
const statesModule = namespace("states");

@Component({
  components: {
    Slider,
    Button,
    Numbox,
    Toggle,
    Modal,
    ActionComponent,
    draggable
  }
})
export default class ActionListComp extends Vue {
  @Prop({ required: true })
  public actions!: ActionList;

  public mounted() {
    // debugger
    // this._curve = CurvePlayer.getCurveForChannel(this.channelProp) || null;
  }
  get availableTypes() {
    return ActionFactory.actionNames;
  }
  public addAction(e: string) {
    this.actions.addFromName(e)
  }
  public getIcon(a:ActionInstance){
    debugger;
    const type = a.getATYPE().atype
    if(type ==="setDimmer"){
      return 'car-light-high'
    }
    if(type==="setColor"){
      return 'palette'
    }
    else if (type==="setPos"){
      return 'crosshairs-gps'
    }

    return 'drag'
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
input {
  font-size: x-large;
}
</style>
