<template>
  <div class="fixtureWidget">{{fixtureProp.name}}
    <!-- <input :value="fixtureProp.name" @change="setFixtureName({fixture:fixtureProp,value:$event.target.value})"/> -->
    <!-- <Button @click="addChannelToFixture({fixture:fixtureProp})" text="addChannel"/> -->
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
import { DirectFixture } from '../api/Fixture';
import FixtureMethods from '../store/fixtures';


const fixturesModule = namespace('fixtures');

@Component({
  components: {Slider, Button, Toggle, ChannelWidget},
})
export default class FixtureWidget extends Vue {

  @fixturesModule.Mutation('addChannelToFixture') public addChannelToFixture!: FixtureMethods['addChannelToFixture'];
  @fixturesModule.Mutation('setFixtureName') public setFixtureName!: FixtureMethods['setFixtureName'];

  // @fixturesModule.Mutation('setChannelValue') public setChannelValue!: FixtureMethods['setChannelValue'];
  // @fixturesModule.Mutation('setChannelName') public setChannelName!: FixtureMethods['setChannelName'];
  // @fixturesModule.Mutation('setChannelEnabled') public setChannelEnabled!: FixtureMethods['setChannelEnabled'];


  @Prop() public fixtureProp!: DirectFixture;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;

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

</style>
