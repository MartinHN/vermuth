<template>
  <div>
    <MultiSlider v-model="linkableStateDims" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import MultiSlider from "@/components/Inputs/MultiSlider.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import StateEditor from "@/components/Editors/StateEditor.vue";
import { State } from "@API/State";
import rootState from "@API/RootState";

import StateMethods from "../store/states";

const statesModule = namespace("states");
type ValueOf<T> = T[keyof T];
// type State = ValueOf<StateMethods['states']>;
@Component({
  components: { Button, MultiSlider, Toggle, StateEditor },
})
export default class MultiStateChooser extends Vue {
  @Prop()
  private state!: State;

  public mounted() {}

  get linkableStateDims() {
    const r: { [id: string]: number } = {};

    if (!this.state || this.state === null) {
      return r;
    }
    const state = this.state as State;
    rootState.stateList.stateNames
      .filter((e) => e !== state.name)
      .map((n) => {
        const lsObj = state.linkedStates.find((e) => e.name === n);
        r[n] =
          lsObj !== undefined ? (lsObj.dimMaster ? lsObj.dimMaster : 0) : 0;
      });
    // console.log(r);
    return r;
  }

  set linkableStateDims(vd: { [id: string]: number }) {
    if (!this.state) {
      return;
    }
    const l = Object.entries(vd).map(([k, v]) => {
      return { name: k, dimMaster: v };
    });
    this.state.setLinkedStates(l);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/*div{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
*/
div {
  width: 100%;
}
select {
  height: 100%;
  width: 100%;
  min-width: 20px;
}

.remove {
  background-color: red;
}
</style>
