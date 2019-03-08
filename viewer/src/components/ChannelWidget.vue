<template>
  <div class="channelWidget">
    <Toggle v-model="enabledV" text="enabled"/>
    <slider class="slider" @input="setChannelValue({channel:channelProp,value:$event})" :value="channelProp.value" :name="channelProp.name"  :showName="true" :showValue="true" :enabled="enabledV"></slider>
    

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from './Slider.vue' ;
import Button from './Button.vue' ;
import Toggle from './Toggle.vue' ;
import { ChannelBase } from '../api/Channel';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Slider, Button, Toggle},
})
export default class ChannelWidget extends Vue {

  @fixturesModule.Getter('usedChannels') public usedChannels!: FixtureMethods['usedChannels'];
  @fixturesModule.Mutation('setChannelValue') public setChannelValue!: FixtureMethods['setChannelValue'];
  @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];
  @fixturesModule.Mutation('setChannelEnabled') public setChannelEnabled!: FixtureMethods['setChannelEnabled'];


  @Prop() public channelProp!: ChannelBase;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;

  get enabledV(): boolean {return this.channelProp.enabled; }
  set enabledV(v: boolean) {this.setChannelEnabled({channel: this.channelProp, value: v}); }
  get sliderColor():string{
    return this.enabledV?'inherit':'dark';
  }



}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.channelWidget {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
  width:100%;

}
.channelWidget .slider {
  flex-basis:70%;
}
input{
      font-size: x-large;
}
</style>
