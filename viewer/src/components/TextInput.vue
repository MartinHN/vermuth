<template>
  <div class="SliderPH">
    <v-text-field 
    :value="value" 
    @input="$emit('input',$event)" 
    @change="$emit('change',{value:$event})"
    background-color="rgba(255, 255, 255, 0.795)"
    :disabled="!editable"
    >
    </v-text-field> 
    
   
  </div>
</template>
 
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

// var VueSlideBar :any = require( 'vue-slide-bar');

@Component({
  // components:{}
})
export default class TextInput extends Vue {
  @Prop()
 public  name?: string;
  @Prop({default : false})public  showName?: boolean ; // =false;


  @Prop({default: ''}) public value!: string ;

  @Prop({default: true}) public editable?: boolean;

}
</script>


<style scoped>

</style>