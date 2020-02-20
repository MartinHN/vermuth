<template>


  <div class="main"  style="width:100%;height:100%">
    {{curveLink.uid}},{{this.curveLink.curve.uid}}

    <v-select label=curves  v-model="selectedCurve" style="width:100%" :items=availableCurves>
            <template v-slot:item="{item:item}">
              {{item}}
            </template>
    </v-select>
    <v-row no-gutters>
      <v-col cols=6>
        <Numbox text="offset" v-model=curveLink.offset></Numbox>
      </v-col>
      <v-col>
        <Numbox text="length" @change="setSpan" :value="curveLink.curve.span"  min=1></Numbox>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col  cols=6>
        <Button :text="curveLink.doPause?'>':'||'" @click='curveLink.togglePlay()' ></Button>
      </v-col>
      <v-col>
        <Toggle text="doLoop" v-model=curveLink.doLoop></Toggle>
      </v-col> 
    </v-row>
    
    <CurveEditor :curve=curveLink.curve :position=curveLink.time isZoomable=1> </CurveEditor>
    

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
import CurveEditor from '@/components/Editors/CurveEditor.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';


import Slider from '@/components/Inputs/Slider.vue';
import * as CurveUtils from './CurveEditorUtils';
import {CurvePlayer, CurveLink} from '@API/CurvePlayer';
import {CurveStore, CurveBaseI} from '@API/Curve'
import {ChannelBase} from '@API/Channel';

@Component({components: {Slider, CurveEditor, Numbox, Button, Toggle}})
export default class FullCurveEditor extends Vue {

  @Prop({required: true})
  public curveLink!: CurveLink;


  get selectedCurve(){
    return this.curveLink.curve.uid
  }
  set selectedCurve(u:string){
    const cu = CurveStore.getForUID(u)
    if(cu){
    this.curveLink.curve = cu;
  }
  else{
    console.error('curve not found')
  }
  }
  get availableCurves(){
    return CurveStore.curveList.map(c=>c.uid)
  }

  // public set curveOffset(v: number) {
    //   const cl = this.curveLink;
    //   if (cl) {cl.offset = v; }
    // }
    // public get curveOffset() {
      //   const cl = this.curveLink;
      //   return cl ? cl.offset : 0;
      // }
public setSpan(v: number) {
this.curveLink.curve.scaleToSpan(v);
}



      public playNow() {
        this.curveLink.playNow();
      }

    }
</script>


  <style scoped>
</style>