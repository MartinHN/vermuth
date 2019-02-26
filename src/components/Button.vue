<template>
  <label :for="_uid" class="buttonPH" :tabindex="focusable?-1:''">
    <input :id="_uid" type="button" class="button" @click="$emit('click')" :tabindex="focusable?-1:''"/>
    <!-- <label :for="_uid"> -->
    {{text}}
  <!-- </label> -->
  </label>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({})
export default class Button extends Vue{
  @Prop()
  public text?  :string;
  @Prop({default:false})
  public focusable?:boolean;

}
</script>


<style scoped>
input {
  height:0px;
  display:none;
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

label{

  display: block;
  position: relative;
  /*margin: 5px;*/
  padding: 5px 5px 5px 5px;
  border: 2px solid #fff;
  border-radius: 10px;
  color: #fff;
  background-color:transparent;
  box-shadow: 0 0 20px rgba(0, 0, 0, .2);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color .2s, box-shadow .2s;
  text-align: center;
}
</style>