<template>
  <div class="fixtureGroupWidget" :style="{backgroundColor:getFixtureColor(fixtureProp)}">

    <Toggle v-if=isGroup :text="(expanded?'collapse':'expand')+' '+groupName" v-model="expanded" iconOn="chevron-down" iconOff="chevron-right" />
    <div v-if="expanded && isGroup" style="width:100%;background-color:inherit">
      <div style="background-color:inherit" v-for="ff of fixtureProp.fixtures" :key="ff.id">
        <FixtureWidget  :fixtureProp="ff"  :style="{backgroundColor:getFixtureColor(ff)}" :showPresetableState="showPresetableState" :presetableState.sync="presetableState" />
        <div class=spacer />
      </div>
    </div>
    <div v-else style="display:flex;width:100%">
      <FixtureWidget  :fixtureProp="fixtureProp" :showPresetableState="showPresetableState" :presetableState.sync="presetableState" />

    </div>



  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from '@/components/Inputs/Slider.vue';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue' ;
import Point2DEditor from '@/components/Editors/Point2DEditor.vue';
import FixtureWidget from '@/components/Widgets/FixtureWidget.vue';

import {FixtureBase, DirectFixture, FixtureGroup } from '@API/Fixture';
import { ChannelBase } from '@API/Channel';
import UniversesMethods from '@/store/universes';
import {rgbToHex, hexToRgb} from '@API/ColorUtils';
import dbg from '@API/dbg';
import rootState from '@API/RootState';

import {isEqual,debounce} from 'lodash';

const universesModule = namespace('universes');

function isNonEmpty(o: any) {
  return Object.keys(o).length !== 0;
}

@Component({
  components: {Slider, Button, Toggle, Modal, Point2DEditor, FixtureWidget},
})
export default class FixtureGroupWidget extends Vue {

  @Prop({required:true})
  presetableState!: {[id:string]:boolean}
  @Prop({default:false})
  private showPresetableState!:boolean;

  get hasIndividualPreseted(){
    const channels: ChannelBase[] = []
    const subProps = this.fixtureProps?.map(f=>f.channels.map(c=>channels.push(c)));
    if(channels.length){
      return channels.some( c => rootState.stateList.isPreseted(c));
    }
    return false
  }

  get hasMainPreseted(){
      return this.fixtureProp?.channels.some(c=>rootState.stateList.isPreseted(c));
  }

  @Watch('hasIndividualPreseted')
  expandIfSub(){ // if we load a preset modifying inner values, we force expand
    this.expandIfNeeded()
  }
    @Watch('hasMainPreseted')
  expandIfMain(){ // if we load a preset modifying inner values, we force expand
    this.expandIfNeeded()
  }

  expandIfNeeded(){
    if(!this.hasMainPreseted && this.hasIndividualPreseted){
      this.expanded = true
    }
    else if(this.hasMainPreseted && !this.hasIndividualPreseted){
      this.expanded = false
    }
    else if(!this.hasMainPreseted && !this.hasIndividualPreseted){ // default to collapsed
      this.expanded=  false
    }
    else{
    dbg.error("invalid preset state")
    }
  }
  get masterInSync() {
    if (FixtureGroup.isFixtureGroup(this.fixtureProp)) {
      return this.fixtureProp.dimmerInSync;
    }
    return true;
  }
  get hasColorChannels() {
    return this.fixtureProp.hasColorChannels;
  }
  get colorValue() {
    return this.fixtureProp.getColor() ;
  }
  get isGroup() {
    return FixtureGroup.isFixtureGroup(this.fixtureProp);
  }
  get hasDimmerChannels() {
    return this.fixtureProp.hasDimmerChannels;
  }
  set dimmerValue(v: number) {
    this.fixtureProp.dimmerValue = v;
  }
  get dimmerValue() {
    return this.fixtureProp.dimmerValue;
  }

  get fixtureProps() {
    return FixtureGroup.isFixtureGroup(this.fixtureProp) ? this.fixtureProp.fixtures : [];
  }
  get groupName() {
    return this.fixtureProp.name;
  }
  get hasPositionChannels() {
    return   this.fixtureProp.hasPositionChannels;
  }
  set position(p: Array<{x: number, y: number}>) {
    this.fixtureProp.setPosition(p[0]);
  }
  get position(): Array<{x: number, y: number}> {
    return [this.fixtureProp.getPosition()];
  }




  get otherChannels() {
    const otherf = this.fixtureProp.getChannelsOfRole('other');

    if (otherf && otherf.other) {
      return otherf.other;
    }
    return [];
  }

  get hexColorValue(): string {
    const cch = this.colorValue;
    return rgbToHex(cch.r ? cch.r * 255 : 0,
      cch.g ? cch.g * 255 : 0,
      cch.b ? cch.b * 255 : 0);

  }

  set hexColorValue(c: string) {
    this.debouncedColorSetter(c);
  }


  @Prop({required: true}) public fixtureProp!: DirectFixture|FixtureGroup;

  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showProps?: boolean;
  public expanded = false;
  // @statesModule.Getter('presetableNames') public presetableNames!: StatesMethods['presetableNames'];
  // @statesModule.Mutation('setNamePresetable') public setNamePresetable!: StatesMethods['setNamePresetable'];
  public dimmerPresetable = false;
  public colorPresetable = false;
  public positionPresetable = false;
  private showPosModal = false;

  private debouncedColorSetter = debounce((c: string) => {
    const color: any = hexToRgb(c, true);
    this.setColor( color, true);

  },
  50,
  {maxWait: 50});

  public getFixtureColor(f: FixtureBase) {
    return FixtureGroup.isFixtureGroup(f) ? 'black' : 'grey';
  }

  public setColor(c: {r: number, g: number, b: number}, setWhiteToZero: boolean) {
    this.fixtureProp.setColor(c, setWhiteToZero);
  }







}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fixtureGroupWidget {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  
}
.fixtureWidget{
  width:100%;
  background-color:inherit;
}

.spacer{
  width:100%;
  height:3px;
  background:white;
}

</style>
