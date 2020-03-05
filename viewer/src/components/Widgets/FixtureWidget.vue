<template>
  <div class="fixtureWidget" >
    <div style="display:flex;width:100%">
        
      <ChannelWidget v-for='d in matchedDimmerChannels' :key='d.id' :channelProp=d :overrideName="matchedDimmerChannels.length==1?fixtureProp.name:d.name" style="width:100%" :showProps=showProps ></ChannelWidget>

    </div>

    <div style="display:flex;width:100%" v-if='(fixtureProp.hasChannelsOfRole("color") && hasFilterType("color"))' >

      <input type="color" style="flex:1 1 30%" v-if='!showProps && fixtureProp.hasChannelsOfRole("color") && hasFilterType("color")' v-model=hexColorValue></input>
      <ChannelWidget v-for="c of colorChannels" :key='c.id' :channelProp="c" v-if='c.matchFilterList(filterList)' :showProps=showProps />

    </div>

    <div style="display:flex;width:100%" v-if='(fixtureProp.hasChannelsOfRole("position") && hasFilterType("position"))' >
      <Button text="setPos" @click="showPosModal=true"/>
      <modal v-if="showPosModal" @close="showPosModal = false">
    <!--
      you can use custom content here to overwrite
      default content
    -->
        <h3 slot="header">fixtur pos</h3>
        <Point2DEditor slot="body" :value="fixturePositionList" @input="setFixturePosition($event)"></Point2DEditor>
      </modal>

      <ChannelWidget v-for='c of fixtureProp.getChannelsOfRole("position")' :key='c.id' :channelProp="c" v-if='c.matchFilterList(filterList)' :showProps=showProps />

    </div>
    <div style="width:100%">

      <ChannelWidget style="width:100%" v-for="c of otherChannels" v-if='c.matchFilterList(filterList)' :key='c.id' :channelProp="c" :showProps=showProps />

    </div>

    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from '@/components/Inputs/Slider.vue';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue' ;
import Point2DEditor from '@/components/Editors/Point2DEditor.vue';
import ChannelWidget from './ChannelWidget.vue';
import { DirectFixture } from '@API/Fixture';
import { ChannelBase } from '@API/Channel';
import UniversesMethods from '@/store/universes';
import {rgbToHex, hexToRgb} from '@API/ColorUtils';
import _ from 'lodash';

const universesModule = namespace('universes');

@Component({
  components: {Slider, Button, Toggle, ChannelWidget, Modal, Point2DEditor},
})
export default class FixtureWidget extends Vue {
  get colorChannels(): any {
    return this.fixtureProp.colorChannels;
  }
  get matchedDimmerChannels() {
    return Object.values(this.dimmerChannels).filter( (c) => (c as ChannelBase).matchFilterList(this.filterList));
  }
  get dimmerChannels(): any {
    return this.fixtureProp.dimmerChannels;
  }

  get otherChannels() {
    const res =  this.fixtureProp.getChannelsOfRole('other');
    if (Object.keys(res).length > 1) {
      debugger;
    }
    if (res && res.other) {
      return res.other;
    }

    return [];
  }

  get hexColorValue(): string {
    const cch = this.colorChannels;
    return rgbToHex(cch.r ? cch.r.intValue : 0,
      cch.g ? cch.g.intValue : 0,
      cch.b ? cch.b.intValue : 0);

  }

  set hexColorValue(c: string) {
    this.debouncedColorSetter(c);
  }

  @universesModule.Mutation('addChannelToFixture') public addChannelToFixture!: UniversesMethods['addChannelToFixture'];
  @universesModule.Mutation('setFixtureName') public setFixtureName!: UniversesMethods['setFixtureName'];

  @universesModule.Mutation('setFixtureValue') public setFixtureValue!: UniversesMethods['setFixtureValue'];
  @universesModule.Mutation('setFixtureColor') public setFixtureColor!: UniversesMethods['setFixtureColor'];

  @universesModule.Mutation('setChannelValue') public setChannelValue!: UniversesMethods['setChannelValue'];


  @Prop() public fixtureProp!: DirectFixture;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;
  @Prop({default: false})    public showProps?: boolean;

  @Prop ({default: []}) public filterList!: string[];
  private showPosModal = false;
  private debouncedColorSetter = _.debounce((c: string) => {
    const color: any = hexToRgb(c, true);
    this.setFixtureColor({fixture: this.fixtureProp, color, setWhiteToZero: true});

  },
  50,
  {maxWait: 50});

  public hasFilterType(n: string) {
    if (!this.filterList) {return true; }
    if (this.filterList.some((e) => e === 'all')) {return true; }
    return this.filterList.some((e) => e.startsWith(n));
  }

  public setFixturePosition(p: Array<{x: number, y: number}>) {
    this.fixtureProp.setPosition(p[0]);
  }
  get fixturePositionList() {
    return [this.fixtureProp.getPosition()];
  }


  // get disabledV(): boolean {return !this.fixtureProp.channel.enabled; }
  // set disabledV(v: boolean) {this.setChannelEnabled({channel: this.fixtureProp.channel, value: !v}); }




}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fixtureWidget {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
}
.fixtureValue{
  width:100%;
}

</style>
