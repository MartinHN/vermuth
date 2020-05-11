<template>
  <div :style="{ 'background-color':color }">
    <!-- <label :for="_uid"> -->
    <input type="color" style="height:40px;display:inherit;left:inherit;position:inherit" v-if="mini" @change="sendEv('change',$event)" @input="sendEv('input',$event)" />

    <v-color-picker v-else @change="sendEv('change',$event)" @input="sendEv('input',$event)" />

  </div>
</template>

  <script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import {hexToRgb} from "@API/ColorUtils"
@Component({})
export default class ColorPicker extends Vue {
  @Prop()
  public text?: string;
  @Prop({ default: false })
  public focusable?: boolean;
  @Prop({ default: "transparent" })
  public color?: string;
  @Prop()
  icon?: string;

  @Prop({default:true})
  mini!:boolean
  @Prop({ default: { r: 0, g: 0, b: 0 } })
  public value!: { r: number; g: number; b: number };

  private sendEv(type: string, ev: any) {
  
    const h = ev.target.value;
    const v = hexToRgb(h, true);
    debugger
    if (type !== "input") {
      this.$emit(type,v);
      this.$emit("input", v);
    }
    else{
       this.$emit("input", v);
    }
  }
}
</script>


<style scoped>
input {
  height: 0px;
  display: none;
  position: fixed;
  left: -10000000px;
  /*  background-color: #4CAF50; 
  border: 2px solid #fff;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;*/
}
/*.buttonPH{
  
  
  margin: 5px;
  padding: 5px 10px 10px 20px;
  border: 2px solid #fff;
  border-radius: 10px;
  color: #fff;
  background-color:transparent;
  box-shadow: 0 0 20px rgba(0, 0, 0, .2);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color .2s, box-shadow .2s;
  }*/

.unselectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

label {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  /*padding: 5px 5px 5px 5px;*/
  border: 2px solid #fff;
  border-radius: 10px;
  color: #fff;
  background-color: transparent;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  /*white-space: nowrap;*/
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, box-shadow 0.2s;
  text-align: center;
  width: 100%;
}
</style>