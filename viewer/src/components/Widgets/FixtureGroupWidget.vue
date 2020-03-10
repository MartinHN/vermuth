<template>
  <div class="fixtureGroupWidget" >
    <Toggle :text="expanded?'collapse':'expand'" v-model=expanded />
    <div v-if=expanded class="pa-0 ma-0" style="width:100%;background-color:inherit">
      <FixtureWidget v-for="f in fixtureProps" :key="f.id" :fixtureProp=f :filterList="['all']"/>
    </div>
    <div v-else style="display:flex;width:100%">
      {{groupName}}
      <Slider v-if="hasDimmerChannels" v-model="dimmerValue" :text="groupName" style="width:100%" :enabled=masterInSync ></Slider>
    </div>

    <div style="display:flex;width:100%" v-if='hasColorChannels' >

      <input type="color" style="flex:1 1 30%" v-if='!showProps' v-model=hexColorValue></input>

    </div>

    <div style="display:flex;width:100%" v-if='hasPositionChannels' >
      <Button text="setPos" @click="showPosModal=true"/>
      <modal v-if="showPosModal" @close="showPosModal = false">

        <h3 slot="header">{{groupName}} pos</h3>
        <Point2DEditor slot="body" :value="position" @input="position = ($event?$event[0]:[])"></Point2DEditor>
      </modal>

    </div>



  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue,Watch } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from '@/components/Inputs/Slider.vue';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue' ;
import Point2DEditor from '@/components/Editors/Point2DEditor.vue';
import FixtureWidget from '@/components/Widgets/FixtureWidget.vue';

import { DirectFixture } from '@API/Fixture';
import { ChannelBase } from '@API/Channel';
import UniversesMethods from '@/store/universes';
import {rgbToHex, hexToRgb} from '@API/ColorUtils';


import _ from 'lodash';

const universesModule = namespace('universes');

function isNonEmpty(o:any){
  return Object.keys(o).length!==0
}

@Component({
  components: {Slider, Button, Toggle, Modal, Point2DEditor,FixtureWidget},
})
export default class FixtureGroupWidget extends Vue {


  @Prop() public fixtureProps!: DirectFixture[];
  @Prop() public groupName!: DirectFixture;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showProps?: boolean;
  private showPosModal = false;
  public expanded=false;

  
  get masterInSync(){
    // debugger
    // const fk = this.dimmerChannels
    if(this.fixtureProps.length){
      const v = this.fixtureProps[0].dimmerValue
      return this.fixtureProps.every(f=>{return f.dimmerInSync && (f.dimmerValue ===v)})
    }
    return false;
  }
  get hasColorChannels() {
    return this.fixtureProps.some(f=>isNonEmpty(f.colorChannels));
  }
  setColor(c:{r:number,g:number,b:number},setWhiteToZero:boolean){
    this.fixtureProps.map(f=>f.setColor(c,setWhiteToZero))
  }
  get colorValue(){
    return this.fixtureProps?this.fixtureProps[0].getColor():{r:0,g:0,b:0};
  }
  


  get hasDimmerChannels() {
    return this.fixtureProps.some(f=>isNonEmpty(f.dimmerChannels));
  }
  set dimmerValue(v:number) {
    this.fixtureProps.map(f=>f.setMaster(v));
  }
  get dimmerValue(){
   return this.fixtureProps ? this.fixtureProps[0].dimmerValue:0;
 }


 get hasPositionChannels(){
  return  this.fixtureProps.some(f=>isNonEmpty(f.positionChannels))
}
set position(p: Array<{x: number, y: number}>) {
  this.fixtureProps.map(f=>f.setPosition(p[0]));
}
get position() : Array<{x: number, y: number}>{
  return this.fixtureProps?[this.fixtureProps[0].getPosition()]:new Array<{x: number, y: number}>();
}

// get fixturePositionList() {
  //   return [this.fixtureProps.getPosition()];
  // }




  get otherChannels() {
    const res = []
    for (const f of this.fixtureProps){
      const otherf =  f.getChannelsOfRole('other');
      if (otherf && otherf.other) {
        res.push(otherf.other);
      }

    }
    return res;
  }

  get hexColorValue(): string {
    const cch = this.colorValue;
    return rgbToHex(cch.r ? cch.r*255 : 0,
      cch.g ? cch.g*255 : 0,
      cch.b ? cch.b*255 : 0);

  }

  set hexColorValue(c: string) {
    this.debouncedColorSetter(c);
  }

  private debouncedColorSetter = _.debounce((c: string) => {
    const color: any = hexToRgb(c, true);
    this.setColor( color, true);

  },
  50,
  {maxWait: 50});

  





}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fixtureGroupWidget {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
}
.fixtureWidget{
  width:100%;
  background-color:inherit;
}

</style>
