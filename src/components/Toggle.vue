<template>
  <div class="toggleContainer">
    <input :id="_uid" type="checkbox" :checked="value" @change="$emit('change', $event.target.checked)" @input="$emit('input', $event.target.checked)" :tabindex="focusable?-1:''" :readonly="!editable" >
    <label :for="_uid" class="slider round">{{text}}</label>

    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';

@Component({})
export default class Toggle extends Vue {
  @Prop()
  public text?: string;
  @Prop({default: false})
  public focusable?: boolean;
  @Prop({default: true})
  public editable?: boolean;
  @Prop({default: false})
  public value  ?: boolean ;



}
</script>


<style scoped>
/*@import url(https://fonts.googleapis.com/css?family=Noto+Sans);*/

*, *::before, *::after {
  box-sizing: border-box;
}


.toggleContainer {
  color: #435757;
  
  /*font: 1.4em/1 'Noto Sans', sans-serif;*/

}

input {
  position: absolute;
  left: -9999px;
}

label {
  display: block;
  position: relative;
  margin: 5px;
  padding: 5px 10px 10px 10px;
  border: 2px solid #fff;
  border-radius: 0px;
  color: #fff;
  background-color:transparent;
  box-shadow: 0 0 20px rgba(0, 0, 0, .2);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color .2s, box-shadow .2s;
}



label:hover, input:focus + label {
  box-shadow: 0 0 20px rgba(0, 0, 0, .6);
}

input:checked + label {
  background-color: green;
}


</style>