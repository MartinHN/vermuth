<template>
    <!-- <v-checkbox  v-model=value :tabindex="focusable?-1:''" :disabled="!editable"  ></v-checkbox> -->
    <!-- <label :for="_uid" class="slider round">{{text}}</label> -->
  <!-- <label :style="{ 'background-color':displayedColor }" :for="_uid" class="slider round">
    <v-icon v-if="iconOn && value">mdi-{{iconOn}}</v-icon>
    <v-icon v-else-if="iconOff && !value">mdi-{{iconOff}}</v-icon>
    <v-icon v-else-if="icon" >mdi-{{icon}}</v-icon>


    <input
      :id="_uid"
      type="checkbox"
      :checked="value"
      @change="sendEv('change', $event)"
      @input="sendEv('input',$event)"
      :tabindex="focusable?-1:''"
      :readonly="!editable"
    />
    {{text}}
  </label> -->

  <v-btn
  :value="value"
  :color="value?'primary':'normal'"
      @click="sendEv('change', $event)"
      >
    {{text}}
  </v-btn>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
let count = 0;
@Component({})
export default class Toggle extends Vue {
  @Prop()
  public text?: string;
  @Prop({ default: false })
  public focusable!: boolean;
  @Prop({ default: true })
  public editable!: boolean;
  @Prop({ default: false })
  public value!: boolean;

  @Prop()
  public iconOn?: string;
  @Prop()
  public iconOff?: string;
  @Prop()
  public icon?: string;


  // public value: boolean = true;
  @Prop({ default: "transparent" })
  public color?: string;

  private _uid = "";
  public mounted() {
    count += 1;
    this._uid = "toggle_" + count;
  }
  get displayedColor() {
    return this.value ? "green" : this.color;
  }
  private sendEv(type: string, ev: any) {
    // this.value = !!ev.target.checked
    if (type !== "input") {
      // osx webkit don't send input event....
      this.$emit(type, !this.value);
      this.$emit("input", !this.value);
    }
  }
}
</script>


<style scoped>
/*@import url(https://fonts.googleapis.com/css?family=Noto+Sans);*/

/**, *::before, *::after {
  box-sizing: border-box;
}

*/

input {
  position: absolute;
  left: -9999px;
}

label {
  display: block;
  width: 100%;
  position: relative;
  /*margin: 5px;
  padding: 5px 10px 10px 10px;*/
  border: 2px solid #fff;
  border-radius: 0px;
  color: #fff;
  /*background-color:transparent;*/
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, box-shadow 0.2s;
}

label:hover,
input:focus + label {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
}

.v-item--active{
color:green  
}
</style>
