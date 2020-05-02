<template>
  <div>
    <v-list label="linkedStates" style="width:100%">
      <v-list-item v-for="(item, i) of valueDic" :key="i">
        
        <Slider :min="0" :max="1" :showName="true" :name="i" :value="valueDic[i]" @input="(e)=>changed(i,e) "></Slider>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import Slider from "@/components/Inputs/Slider.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import StateEditor from "@/components/Editors/StateEditor.vue";
import {  State } from "@API/State";
import rootState from "@API/RootState";

import StateMethods from "../store/states";

const statesModule = namespace("states");
type ValueOf<T> = T[keyof T];
// type State = ValueOf<StateMethods['states']>;
@Component({
  components: { Button, Slider, Toggle, StateEditor },
    model: {
    prop: "valueDic",
    event: "change"
  }

})
export default class MultiStateChooser extends Vue {
  @Prop()
  private valueDic!: { [id: string]: number };

  public mounted() {
    console.log("vdic", this.valueDic);
  }
  private changed(n:string,ev:number) {
    this.valueDic[n] = ev;
    this.$emit("change", this.valueDic);
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
