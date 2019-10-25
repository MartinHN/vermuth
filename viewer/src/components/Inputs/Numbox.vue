<template>
  <div class="NumboxPH">
    <input :class='["Numbox",{error:hasError}]' type="number" :value="value" @input="$emit('input',{value:$event.target.valueAsNumber})" @change="$emit('change',{value:$event.target.valueAsNumber})" :min="min" :max="max" />

    <div ref="Name" v-if="showName">{{name}}</div>
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
 public  name?: string;
  @Prop({default : false})public  showName?: boolean ; // =false;
  @Prop({default : -Infinity})public  min?: number ;
  @Prop({default : +Infinity})public  max?: number ;

  @Prop({default: 0}) public value!: number ;
  @Prop({default : ''}) public errMsg?: string;

  public mounted() {

  }
  public get hasError() {
    return this.errMsg !== '';
  }

}
</script>


<style scoped>
.numboxPH{
  height:100%;
}
input{
  height:100%;
  background-color: #0003;
  padding-left: 5px;
  /*font-size:inherit;*/
}
.error{
  background-color: red;
}
</style>