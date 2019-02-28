<template>
  <div class="channelWidget">
    <Toggle v-model="disabledV" text="disabled"/>
    <slider class="slider" @input="setChannelValue({channelName:fixtureProp.channel.name,value:$event})" :value="fixtureProp.channel.value" :name="fixtureProp.channel.name"  :showName="showName" :showValue="showValue" ></slider>
    
    <input type="text" readonly :value="fixtureProp.channel.name" placeholder="ChannelName"  @change="setChannelName({channel:fixtureProp.channel,name:$event.srcElement.value})"></input> 
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Slider from './Slider.vue' ;
import Button from './Button.vue' ;
import Toggle from './Toggle.vue' ;
import { DirectFixture } from '../api/fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Slider, Button, Toggle},
})
export default class FixtureWidget extends Vue {

  @fixturesModule.Getter('usedChannels') public usedChannels!: FixtureMethods['usedChannels'];
  @fixturesModule.Mutation('setChannelValue') public setChannelValue!: FixtureMethods['setChannelValue'];
  @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];
  @fixturesModule.Mutation('setChannelEnabled') public setChannelEnabled!: FixtureMethods['setChannelEnabled'];


  @Prop() public fixtureProp!: DirectFixture;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;

  get disabledV(): boolean {return !this.fixtureProp.channel.enabled; }
  set disabledV(v: boolean) {this.setChannelEnabled({channel: this.fixtureProp.channel, value: !v}); }

  public widgetChanged(v: any): any {
    // this.setChannelValue({channelName: v.source.name, value: v.value});
    // console.log('widg ch ', v);
  }
  public changeChannel(v: any): any {

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

}
.channelWidget .slider {
  flex-basis:70%;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
