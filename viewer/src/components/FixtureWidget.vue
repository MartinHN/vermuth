<template>
  <div class="fixtureWidget" >
    <div style="display:flex;width:100%">

      <ChannelWidget v-if='dimmerChannel && dimmerChannel.matchFilterList(filterList)' :channelProp=dimmerChannel :overrideName="fixtureProp.name" style="width:100%"></ChannelWidget>

      <input type="color" v-if='fixtureProp.hasColorChannels && hasFilterType("color")' v-model=hexColorValue></input>

    </div>
    <div style="display:flex;width:100%" v-if='(!miniMode && fixtureProp.hasColorChannels && hasFilterType("color"))' >

      <ChannelWidget v-for="c of colorChannels" :key='c.id' :channelProp="c" v-if='c.matchFilterList(filterList)' />

    </div>
    <div v-if=!miniMode style="width:100%">

      <ChannelWidget style="width:100%" v-for="c of otherChannels" v-if='c.matchFilterList(filterList)' :key='c.id' :channelProp="c" />

    </div>

    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from './Slider.vue' ;
import Button from './Button.vue' ;
import Toggle from './Toggle.vue' ;
import ChannelWidget from './ChannelWidget.vue';
import { DirectFixture } from '@API/Fixture';
import { ChannelBase } from '@API/Channel';
import UniversesMethods from '../store/universes';
import {rgbToHex, hexToRgb} from '@API/ColorUtils';
import _ from 'lodash';

const universesModule = namespace('universes');

@Component({
  components: {Slider, Button, Toggle, ChannelWidget},
})
export default class FixtureWidget extends Vue {

  @universesModule.Mutation('addChannelToFixture') public addChannelToFixture!: UniversesMethods['addChannelToFixture'];
  @universesModule.Mutation('setFixtureName') public setFixtureName!: UniversesMethods['setFixtureName'];

  @universesModule.Mutation('setFixtureValue') public setFixtureValue!: UniversesMethods['setFixtureValue'];
  @universesModule.Mutation('setFixtureColor') public setFixtureColor!: UniversesMethods['setFixtureColor'];

  @universesModule.Mutation('setChannelValue') public setChannelValue!: UniversesMethods['setChannelValue'];


  @Prop() public fixtureProp!: DirectFixture;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;
  @Prop ({default: false}) public miniMode?: boolean;
  @Prop ({default: []}) public filterList?: string[];

  get colorChannels(): any {
    return this.fixtureProp.colorChannels;
  }
  get dimmerChannel(): any {
    return this.fixtureProp.dimmerChannel;
  }

  get otherChannels() {
    const nonOtherNames: string[] = [];
    for (const c of ['r', 'g', 'b']) {
      if (this.colorChannels[c]) {
        nonOtherNames.push(this.colorChannels[c].name);
      }
    }
    if (this.dimmerChannel) {nonOtherNames.push(this.dimmerChannel.name); }
    const ot = [];
    for ( const ch of this.fixtureProp.channels) {
      if (! nonOtherNames.find((n) => n === ch.name)) {
        ot.push(ch);
      }
    }
    return ot;
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

  public hasFilterType(n:string){
    if(!this.filterList){return true;}
    return this.filterList.some(e=>e.startsWith(n))
  }

  private debouncedColorSetter = _.debounce((c: string) => {
    const color: any = hexToRgb(c, true);
    this.setFixtureColor({fixture: this.fixtureProp, color});

  },
  50,
  {maxWait: 50});



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
