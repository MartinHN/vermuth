<template>
  <div class="fixtureWidget">
    <div style="display:flex;width:100%;background-color:transparent">
      <ChannelWidget
        v-for="d in matchedDimmerChannels"
        :key="d.id"
        :channelProp="d"
        :overrideName="matchedDimmerChannels.length==1?fixtureProp.name:d.name"
        style="width:100%"
        :showProps="showProps"
        :showPresetableState="showPresetableState"
        :presetable.sync="presetableState[d.name]"
      ></ChannelWidget>
    </div>

    <div
      style="display:flex;width:100%"
      v-if="(fixtureProp.hasChannelsOfRole('color') && hasFilterType('color'))"
    >
      <input
        type="color"
        style="flex:1 1 30%"
        v-if="!showProps && fixtureProp.hasChannelsOfRole('color') && hasFilterType('color')"
        v-model="hexColorValue"
      />
      <ChannelWidget
        v-for="c of matchedColorChannels"
        :key="c.id"
        :channelProp="c"
        :showProps="showProps"
        :showPresetableState="showPresetableState"
        :presetable.sync="presetableState[c.name]"
      />
    </div>

    <div
      style="display:flex;width:100%"
      v-if="(fixtureProp.hasChannelsOfRole('position') && hasFilterType('position'))"
    >
      <Button text="setPos" @click="showPosModal=true" />
      <modal v-if="showPosModal" @close="showPosModal = false">
        <h3 slot="header">fixtur pos</h3>
        <Point2DEditor
          slot="body"
          :value="fixturePositionList"
          @input="setFixturePosition($event)"
          :invertX="true"
          :invertY="true"
        ></Point2DEditor>
      </modal>

      <ChannelWidget
        v-for="c of matchedPositionChannels"
        :key="c.id"
        :channelProp="c"
        :showProps="showProps"
        :showPresetableState="showPresetableState"
        :presetable.sync="presetableState[c.name]"
      />
    </div>
    <div style="width:100%">
      <ChannelWidget
        style="width:100%"
        v-for="c of matchedFogChannels"
        :key="c.id"
        :channelProp="c"
        :showProps="showProps"
        :showPresetableState="showPresetableState"
        :presetable.sync="presetableState[c.name]"
      />
    
    </div>
    <div style="width:100%">
      <ChannelWidget
        style="width:100%"
        v-for="c of matchedOtherChannels"
        :key="c.id"
        :channelProp="c"
        :showProps="showProps"
        :showPresetableState="showPresetableState"
        :presetable.sync="presetableState[c.name]"
      />
    </div>
  </div>
  
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { mapState, mapActions } from "vuex";
import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import Slider from "@/components/Inputs/Slider.vue";
import Button from "@/components/Inputs/Button.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import Point2DEditor from "@/components/Editors/Point2DEditor.vue";
import ChannelWidget from "./ChannelWidget.vue";
import { DirectFixture } from "@API/Fixture";
import { ChannelBase } from "@API/Channel";
import UniversesMethods from "@/store/universes";
import { rgbToHex, hexToRgb } from "@API/ColorUtils";
import { isEqual, debounce } from "lodash";

const universesModule = namespace("universes");

@Component({
  components: { Slider, Button, Toggle, ChannelWidget, Modal, Point2DEditor }
})
export default class FixtureWidget extends Vue {
  @Prop({ required: true })
  presetableState!: { [id: string]: { preseted: boolean; value: number } };

  @Prop({ default: false })
  private showPresetableState!: boolean;
  @Watch("presetableState")
  dd() {
    console.log("presetableState changed");
  }
  get positionChannels(): ChannelBase[] {
    return Object.values(this.fixtureProp.positionChannels);
  }
  get matchedPositionChannels() {
    return this.positionChannels?.filter(
      c => c && c.matchFilterList(this.filterList)
    );
  }
  get colorChannels() {
    return this.fixtureProp.colorChannels;
  }

  get matchedColorChannels() {
    return this.colorChannels;
  }
  get matchedFogChannels(){
        return this.fogChannels.filter(
      c => c && c.matchFilterList(this.filterList)
    );
  }
  get matchedDimmerChannels() {
    return this.dimmerChannels.filter(
      c => c && c.matchFilterList(this.filterList)
    );
  }
  get dimmerChannels() {
    return this.fixtureProp.dimmerChannels || [];
  }
  get fogChannels() {
    const res = this.fixtureProp.getChannelsOfRole("fog");
    if (res && (res.vent || res.heat)) {
      return (res.vent || []).concat( res.heat || []);
    }
    return [];
  }

  get otherChannels() {
    const res = this.fixtureProp.getChannelsOfRole("other");
    if (res && res.other) {
      return res.other;
    }
    return [];
  }
  get matchedOtherChannels() {
    return this.otherChannels?.filter(
      c => c && c.matchFilterList(this.filterList)
    );
  }

  get hexColorValue(): string {
    const cch = this.colorChannels;
    return rgbToHex(
      cch.r ? cch.r.intValue : 0,
      cch.g ? cch.g.intValue : 0,
      cch.b ? cch.b.intValue : 0
    );
  }

  set hexColorValue(c: string) {
    this.debouncedColorSetter(c);
  }

  @universesModule.Mutation("setFixtureColor")
  public setFixtureColor!: UniversesMethods["setFixtureColor"];

  @Prop({ required: true }) public fixtureProp!: DirectFixture;
  @Prop({ default: false }) public showName?: boolean;
  @Prop({ default: false }) public showValue?: boolean;
  @Prop({ default: false }) public showProps?: boolean;

  @Prop({ default: () => [] }) public filterList!: string[];
  private showPosModal = false;
  private debouncedColorSetter = debounce(
    (c: string) => {
      const color: any = hexToRgb(c, true);
      this.setFixtureColor({
        fixture: this.fixtureProp,
        color,
        setWhiteToZero: true
      });
    },
    50,
    { maxWait: 50 }
  );

  public hasFilterType(n: string) {
    if (!this.filterList || !this.filterList.length) {
      return true;
    }
    if (this.filterList.some(e => e === "all")) {
      return true;
    }
    return this.filterList.some(e => e.startsWith(n));
  }

  public setFixturePosition(p: Array<{ x: number; y: number }>) {
    this.fixtureProp.setPosition(p[0]);
  }
  get fixturePositionList() {
    return [this.fixtureProp.getPosition()];
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.fixtureWidget {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: inherit;
}
.fixtureValue {
  width: 100%;
}
</style>
