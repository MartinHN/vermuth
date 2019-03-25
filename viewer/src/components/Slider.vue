<template>
  <div class="SliderPH">
    <input :class='["slider",{inactive:!enabled}]' type="range" :value="value" @input="$emit('input',$event.target.valueAsNumber)" min="0" max="1" :step="Math.pow(10,-precision)"></input> 
    
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
  @Prop({default : Math.log(254) / Math.log(10)})public  precision?: number; // 255 steps
  @Prop({default : 2})public  displayPrecision?: number;

  @Prop({default: 0}) public value!: number ;

  @Prop({default: true}) public enabled?: boolean;
  public mounted() {

  }

  get valToString(): string {
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
  position: absolute;
  margin-top: -40px;
  right:100px;
  /*top:-40px;*/
  z-index: 200;
  user-select: none;
  pointer-events: none;
  cursor: inherit;
}
.Name{
  position: absolute;
  margin-top: -40px;
  margin-left:10px;
  /*top:-40px;*/
  z-index: 200;
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
    height: 40px;
    width: 100%;
    cursor: pointer;
    border-radius: 0; /* iOS */
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
    height: 40px;
    background: #fff;
    box-shadow: -100vw 0 0 100vw dodgerblue;
    /*border: 2px solid #999; /* 1 */
}

.inactive::-webkit-slider-thumb {
  box-shadow: -100vw 0 0 100vw gray;
}

::-moz-range-track {
    height: 40px;
    background: #ddd;
}

/*::-moz-range-thumb {
    background: #fff;
    height: 40px;
    width: 20px;
    border: 3px solid #999;
    border-radius: 0 !important;
    box-shadow: -100vw 0 0 100vw dodgerblue;
    box-sizing: border-box;
}
*/
/*::-ms-fill-lower { 
    background: gray;
}*/

/*::-ms-thumb { 
    background: #fff;
    border: 2px solid #999;
    height: 40px;
    width: 20px;
    box-sizing: border-box;
}*/

::-ms-ticks-after { 
    display: none; 
}

::-ms-ticks-before { 
    display: none; 
}

::-ms-track { 
    background: #ddd;
    color: transparent;
    height: 40px;
    border: none;
}

::-ms-tooltip { 
    display: none;
}
</style>