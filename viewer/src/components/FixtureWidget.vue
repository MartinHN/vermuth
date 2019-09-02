<template>
  <div class="fixtureWidget">
    
    <Slider class="fixtureValue" @input="setFixtureValue({fixture:fixtureProp,value:$event})" :value=fixtureProp.globalValue :enabled=fixtureProp.inSync :name=fixtureProp.name :showName="true" :showValue="true" ></Slider>
    <input type="color" v-if="colorChannels.r!==undefined" v-model=hexColorValue></input>
    <ChannelWidget v-for="c of fixtureProp.channels" :key='c.id' :channelProp="c" />

    
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

  get colorChannels(): any {
    return {
      r: this.fixtureProp.channels.find((n) => n.name === 'r') ,
      g: this.fixtureProp.channels.find((n) => n.name === 'g') ,
      b: this.fixtureProp.channels.find((n) => n.name === 'b'),
    };


  }

  get hexColorValue(): string {
    return rgbToHex(this.colorChannels.r.intValue,
      this.colorChannels.g.intValue,
      this.colorChannels.b.intValue);


  }
  set hexColorValue(c: string) {
    this.debouncedColorSetter(c);

    // const rgb:any = hexToRgb(c);
    // for( c of ['r','g','b']){
    //   this.setChannelValue({channel:this.colorChannels[c],value:rgb[c]/255.0,dontNotify:false});
    // }

  }
  private debouncedColorSetter = _.debounce((c: string) => {
    const color: any = hexToRgb(c,true)
    this.setFixtureColor({fixture:this.fixtureProp,color})


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
