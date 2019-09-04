<template>
  <div class="SliderPH">
    <input :class='["slider",{inactive:!enabled}]' type="range" :value="value" @input="$emit('input',$event.target.valueAsNumber)" min="0" max="1" :step="Math.pow(10,-precision)">
    
    <div ref="Value" class="Value" v-if="showValue">{{valToString}}</div>
    <div ref="Name" class="Name" v-if="showName">{{name}}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
// var VueSlideBar :any = require( 'vue-slide-bar');

@Component({
  // components:{VueSlideBar}
})
export default class Slider extends Vue {
  @Prop()
  public  name?: string;
  @Prop({default : false})public  showName?: boolean ; // =false;
  @Prop({default : true})public  showValue?: boolean ; // =false;
  @Prop({default : 3})public  precision?: number; // note 255 steps would be Math.log(254) / Math.log(10)
  @Prop({default : 2})public  displayPrecision?: number;

  @Prop({default: 0}) public value!: number ;

  @Prop({default: true}) public enabled?: boolean;
  public mounted() {

  }

  get valToString(): string {
    const valid = !Number.isNaN(this.value) && this.value.toFixed;
    if (!valid) {
      console.error('Nan on slider');
      debugger;
      return '0';
    }
    return this.value.toFixed(this.displayPrecision);


  }
}
</script>


<style scoped>
.sliderPH{
  position:relative;
  display: inline-block;
}
.Value{
  position: relative;
  margin-top: -30px;
  margin-right:-50%;
  /*top:-40px;*/
  z-index: 2;
  user-select: none;
  pointer-events: none;
  cursor: inherit;
}
.Name{
  position: absolute;
  margin-top: -1.5rem;
  margin-left: 1rem;
  /*top:-40px;*/
  z-index: 2;
  user-select: none;
  pointer-events: none;
  cursor: inherit;
}
.active{
  background: dodgerblue;
}
.inactive{
  background: #ddd;
}


input[type="range"] { 
  margin: auto;
  -webkit-appearance: none;
  position: relative;
  overflow: hidden;
  height: 30px;
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
  height: 30px;
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
  height: 30px;
  border: none;
}

::-ms-tooltip { 
  display: none;
}
</style>