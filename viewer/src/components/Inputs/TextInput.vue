<template>
    
    <v-text-field 
    v-if=editable
    :value="value" 
    @input="$emit('input',$event)" 
    @change="$emit('change',{value:$event})"

    :disabled="!editable"
    dense
    full-width
    >
    </v-text-field> 
    <div class="nonEditableText" v-else>
      {{value}}
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
.nonEditableText{
text-align: left;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
</style>