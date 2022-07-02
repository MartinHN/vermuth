<template>
  <div :class="['sliderPH', { inactive: !enabled }]">
    <input
      :class="['slider', { inactive: !enabled }]"
      type="range"
      :value="parseFloat(value)"
      @input="$emit('input', $event.target.valueAsNumber)"
      :min="min"
      :max="max"
      :step="Math.pow(10, -precision)"
    />

    <div ref="Name" class="Name" v-if="showName">{{ name }}</div>
    <div ref="Value" class="Value" v-if="showValue">{{ valToString }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
// var VueSlideBar :any = require( 'vue-slide-bar');

@Component({
  // components:{VueSlideBar}
})
export default class Slider extends Vue {
  @Prop()
  public name?: string;
  @Prop({ default: false }) public showName?: boolean; // =false;
  @Prop({ default: true }) public showValue?: boolean; // =false;
  @Prop({ default: 3 }) public precision?: number; // note 255 steps would be Math.log(254) / Math.log(10)
  @Prop({ default: 2 }) public displayPrecision?: number;

  @Prop({ default: 0 }) public value!: number;

  @Prop({ default: true }) public enabled?: boolean;
  @Prop({ default: 0 }) public min!: number;
  @Prop({ default: 1 }) public max!: number;
  public mounted() {}

  get valToString(): string {
    const valid = !Number.isNaN(this.value) && this.value.toFixed;
    if (!valid) {
      console.error("Nan on slider");
      debugger;
      return "0";
    }
    let st = this.value.toFixed(this.displayPrecision);
    if (st.startsWith("0.")) {
      st = st.substring(1);
    }

    return st;
  }
}
</script>


<style scoped>
.sliderPH.inactive {
  background: "red";
}

.sliderPH {
  font-size: small;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  background: #ddd;
}

.Value {
  color: black;
  position: absolute;
  height: 100%;
  top: 3px;
  right: 3px;
  margin-left: 5%;
  z-index: 2;
  user-select: none;
  pointer-events: none;
  cursor: inherit;
}
.Name {
  color: black;
  position: absolute;
  /*height:100%;*/
  bottom: 0px;
  margin-left: 3px;

  /*top:-40px;*/
  z-index: 2;
  user-select: none;
  pointer-events: none;
  cursor: inherit;
}
.active {
  background: dodgerblue;
}

input[type="range"] {
  margin: auto;
  -webkit-appearance: none;
  position: relative;
  overflow: hidden;
  height: 100%;
  width: 100%;
  cursor: pointer;
  border-radius: 0; /* iOS */
  border: black;
  border-width: 1px;
  border-style: solid;
}

::-webkit-slider-runnable-track {
  background: #ddd;
}
.inactive::-webkit-slider-runnable-track {
  background: #aaa;
}

/*
 * 1. Set to 0 width and remove border for a slider without a thumb
 */
::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 0px; /* 1 */
  height: 30px;
  background: #fff;
  box-shadow: -100vw 0 0 100vw dodgerblue;
  /*border: 2px solid #999; /* 1 */
}

.inactive::-webkit-slider-thumb {
  box-shadow: -100vw 0 0 100vw gray;
}

::-moz-range-track {
  height: 100%;
  background: #ddd;
}

::-ms-ticks-after {
  display: none;
}

::-ms-ticks-before {
  display: none;
}

::-ms-track {
  background: #ddd;
  color: transparent;
  height: 100px;
  border: none;
}

::-ms-tooltip {
  display: none;
}
</style>
