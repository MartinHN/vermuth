<template>
  <div class="main">
    <div class="Sequencer">
      <v-container fluid>
        <v-row no-gutters>
          <v-col cols="3">
            <div>{{Number.parseFloat(globalTransport.beat).toFixed(2)}}</div>
          </v-col>
          <v-col cols="3">
            <Toggle
              v-model="togglePlay"
              style="height:40px"
              :text="playState"
              iconOn="stop"
              iconOff="play"
            ></Toggle>
          </v-col>
          <v-col>
            <Numbox text="idx" :value="playedIdx" @change="playedIdx=$event"></Numbox>
            <div style="display:flex">
              <Button @click="prev" text="prev" icon="skip-previous" />
              <Button @click="next" text="next" icon="skip-next" />
            </div>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col cols="6">
            <Toggle v-model="editOrder" text="Edit" icon="pencil" />
          </v-col>
          <v-col cols="3">
            <v-menu offset-y class="text-center">
              <template v-slot:activator="{ on }">
                <v-btn color="primary" dark v-on="on">
                  <v-icon>mdi-plus</v-icon>Add Sequence
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(item, index) in stateList.stateNames"
                  :key="index"
                  @click="addSequence(item)"
                >
                  <v-list-item-title>{{ item}}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
        <div :style="{width:'100%', height:'5px'}">
          <div :style="{width:pctDone,height:'100%',background:'red'}"></div>
        </div>
      </v-container>
      <draggable
        v-model="seqList"
        group="people"
        @start="drag=true"
        @end="drag=false"
        style="width:100%"
        handle=".handle"
      >
        <v-row v-for="(s,i) in seqList" :key="s.id" no-gutters>
          <v-col
            cols="1"
            :style="{backgroundColor:(selectedIdx===i?'red':'transparent')}"
            class="handle ma-0"
          >
            <div @click="seqClicked(i)" class="pa-0 ma-0">
              <v-icon style="width:10%">mdi-drag</v-icon>
              {{i}}
            </div>
          </v-col>
          <v-col>
            <SequenceComponent
              style="width=90%"
              :editMode="editOrder"
              :seqNumber="i"
              :sequence="s"
              :style="{background:getHighlightedColor(i)}"
              @click.native="seqClicked(i)"
              :selected="selectedIdx===i"
            />
          </v-col>
        </v-row>
      </draggable>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Numbox from "@/components/Inputs/Numbox.vue";
import SequenceComponent from "./SequenceComponent.vue";
import { Sequence } from "@API/Sequence";
import SequenceMethods from "../store/sequence";
import StatesMethods from "../store/states";
import rootState from "@API/RootState";
const sequenceModule = namespace("sequence");
const statesModule = namespace("states");
import draggable from "vuedraggable";
import dbg from "@API/dbg";

@Component({
  components: { Button, Numbox, SequenceComponent, Toggle, draggable }
})
export default class Sequencer extends Vue {
  get isPlayingSeq() {
    return this.seqPlayer.isPlaying;
  }
  get pctDone() {
    return this.seqPlayer.pctDone < 1
      ? this.seqPlayer.pctDone * 100 + "%"
      : "0%";
  }
  get playState() {
    return this.globalTransport.isPlaying ? "stop" : "play";
  }
  get playedIdx() {
    return this.seqPlayer.curPlayedIdx;
  }
  set playedIdx(n: number) {
    this.seqPlayer.curPlayedIdx = n;
  }

  get seqList() {
    return this.sequenceList.listGetter;
  }
  set seqList(newL: any[]) {
    const orig = this.seqList;
    const swapped: any[] = [];
    newL.map((e, ni) => {
      if (swapped.indexOf(e) >= 0) {
        return;
      }
      const i = orig.indexOf(e);
      if (i < 0 || orig[ni] === undefined) {
        dbg.error("element deleted while reordering");
        return;
      }
      if (ni !== i) {
        this.sequenceList.swap(e, orig[ni]);
        swapped.push(e);
        swapped.push(orig[ni]);
      }
    });
  }

  get seqPlayer() {
    return rootState.sequencePlayer;
  }

  get togglePlay() {
    return this.globalTransport.isPlaying;
  }
  set togglePlay(v: boolean) {
    if (v) {
      this.globalTransport.start();
    } else {
      this.globalTransport.stop();
    }
  }
  get playText() {
    return this.togglePlay ? "stop" : "play";
  }

  public selectedIdx = 0;

  @sequenceModule.State("sequenceList")
  public sequenceList!: SequenceMethods["sequenceList"];
  @sequenceModule.State("globalTransport")
  public globalTransport!: SequenceMethods["globalTransport"];

  @statesModule.State("stateList")
  public stateList!: StatesMethods["stateList"];

    @Action("SAVE_SESSION") public SAVE_SESSION!: () => void;

  public editOrder = false;

  public seqClicked(i: number) {
    this.selectedIdx = i;
  }

  public addSequence(n: string) {
    this.sequenceList.insertNewSequence(n, n, this.selectedIdx+1);
    setTimeout(this.SAVE_SESSION,500);
  }
  public mounted() {
    window.addEventListener("keydown", this.processKey);
  }
  public activated() {
    window.addEventListener("keydown", this.processKey);
  }

  public deactivated() {
    window.removeEventListener("keydown", this.processKey);
  }
  public destroyed() {
    window.removeEventListener("keydown", this.processKey);
  }

  public getHighlightedColor(i: number) {
    return this.playedIdx === i
      ? this.isPlayingSeq
        ? "green"
        : "lightgreen"
      : "";
  }

  public next() {
    this.playedIdx = Math.max(
      0,
      Math.min(this.seqList.length - 1, this.playedIdx + 1)
    );
  }
  public prev() {
    this.playedIdx = Math.max(
      0,
      Math.min(this.seqList.length - 1, this.playedIdx - 1)
    );
  }
  public goOnSelected() {
    if (this.selectedIdx >= 0) {
      this.seqPlayer.curPlayedIdx = this.selectedIdx;
    } else {
      console.error("no seq selected");
      debugger;
    }
  }
  private processKey(event: KeyboardEvent) {
    // console.log(event)
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === "e") {
        event.preventDefault();

        this.editOrder = !this.editOrder;
      }
      // const letter  =String.fromCharCode(event.which).toLowerCase();
    } else if (event.key === " ") {
      event.preventDefault();
      this.goOnSelected();
    } else if (event.shiftKey) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.selectedIdx = (this.selectedIdx + 1) % this.sequenceList.length;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.selectedIdx =
          (this.selectedIdx + this.sequenceList.length - 1) %
          this.sequenceList.length;
      }
       else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.prev();
      }
    }
    console.log(event);
  }
}
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.Sequencer {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: gray;
}
.seqLine {
  width: 100%;
  margin: 20px;
  /*height:100px;*/
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.circNum {
  /*width: 30px;*/
  font-size: x-large;
}

.channelName {
  left: 0;
  flex: 0 0 30%;
  font-size: x-large;
  /*display: None;*/
}

.circCell {
  flex: 1 1 10%;
  display: -webkit-inline-box;
  /*flex-direction:row;*/
  justify-content: space-around;
  /*align-content: center;*/
  align-items: center;
}

.removeChannel {
  background-color: red;
}
</style>
