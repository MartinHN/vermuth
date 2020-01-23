<template>
  <div class="NumboxPH tooltip pa-0 ma-0">
    <span class="tooltiptext">{{errMsg}}</span>
    <v-text-field v-if=editable 
    class="pa-0 ma-0"
    type="number" :value="value" 
    @input="emitEv('input',$event)" @change="emitEv('change',$event)" 
    :min="min" :max="max" 
    :error-messages=errMsg
    hide-details
    dense
    :label='text||undefined'
    
    />

    <div v-else>
      {{value}}
    </div>
    
  </div>




</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
// var VueSlideBar :any = require( 'vue-slide-bar');

@Component({
  // components:{VueSlideBar}
})
export default class Numbox extends Vue {
  @Prop()
  public  text?: string;

  @Prop({default : -Infinity})public  min?: number ;
  @Prop({default : +Infinity})public  max?: number ;

  @Prop({default: 0}) public value!: number ;
  @Prop({default : ''}) public errMsg?: string;
  @Prop({default: true}) public editable!: boolean;

  public mounted() {

  }
  public get hasError() {
    return this.errMsg !== '';
  }

  private emitEv(type:string,e:string){
    this.$emit(type,parseInt(e))
  }

}
</script>


<style scoped>
.numboxPH{
  height:100%;
  width:100%;
}
input{
  height:100%;
  background-color: #0003;
  padding-left: 5px;
  width:100%;
  /*font-size:inherit;*/
}
/*.error{
  background-color: red;
}
*/
 /* .tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
  }*/

  .tooltip .tooltiptext {
    display: none;
    width: 120px;
    background-color: black;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;

    /* Position the tooltip */
    position: absolute;
    z-index: 1;
    top: -5px;
    left: 105%;
  }

  .tooltip:hover .tooltiptext {
    display: inherit;
  }
</style>