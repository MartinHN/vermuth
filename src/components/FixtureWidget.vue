<template>
  <div class="fixtureWidget">
    <widget type="Slider" @value-change="widgetChanged($event)" :valuestore="fixtureProp.channel.value" :name="fixtureProp.channel.name"  :showName="showName" :showValue="showValue" ></widget>
    
    <input type="text" :value="fixtureProp.channel.name" placeholder="ChannelName"  @change="setChannelName({channel:fixtureProp.channel,name:$event.srcElement.value})"></input> 
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapState, mapActions } from 'vuex';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Widget from './Widget.vue' ;
import { DirectFixture } from '../api/fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Widget},
})
export default class FixtureWidget extends Vue {

  @fixturesModule.Getter('usedChannels') public usedChannels!: FixtureMethods['usedChannels'];
  @fixturesModule.Mutation('setChannelValue') public setChannelValue!: FixtureMethods['setChannelValue'];
  @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];


  @Prop() public fixtureProp!: DirectFixture;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;


  public widgetChanged(v: any): any {
    this.setChannelValue({channelName: v.source.name, value: v.value});
    // console.log('widg ch ', v);
  }
  public changeChannel(v: any): any {

  }




}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fixtureWidget {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
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
