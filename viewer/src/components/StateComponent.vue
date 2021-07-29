<template>
  <div>
    <v-row no-gutters>
      <v-col>
        <v-list dense class="overflow-y-auto" :style="{'max-height':maxHeight || 'none'}">
          <!-- <v-subheader>Presets</v-subheader> -->
          <v-list-item-group v-model="selectedStateIdx">
            <!-- v-model="item" color="primary"> -->
            <v-list-item v-for="(s) in stateNames" :key="s.id">
              <v-list-item-content>
                <v-list-item-title v-html="s"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
      <v-col cols="3" v-if="canEditStates">
        <div id="stateActions">
          <Button
            class="add"
            @click="saveNewState"
            :text="editedState?'save':'add'"
            :icon="editedState?'content-save':'plus'"
          ></Button>

     <!--     <Button v-if="editedState" class="edit" @click="editState" text="edit" icon="pencil"></Button> -->
          <Button
            v-if="editedState"
            class="remove"
            @click="removeStatePrompt"
            text="-"
            color="red"
            icon="delete"
          ></Button>
          <v-menu v-if="editedState">
            <template v-slot:activator="{ on }">
              <v-btn color="primary" dark v-on="on">linked States</v-btn>
            </template>
            <MultiStateChooser style="width:100%" :state="selectedState" />
          </v-menu>
        </div>
      </v-col>
    </v-row>

    <Modal v-if="showStateEditor" @close="showStateEditor=false">
      <h3 slot="header">StateEditor : {{editedState?editedState.name:"no state"}}</h3>
      <StateEditor slot="body" :state="editedState" />
    </Modal>
  </div>
</template>

<script lang="ts">
import { Watch, Component, Prop, Vue } from "vue-property-decorator";
import { Action, Getter, Mutation, namespace } from "vuex-class";
import Button from "@/components/Inputs/Button.vue";
import Toggle from "@/components/Inputs/Toggle.vue";
import Modal from "@/components/Utils/Modal.vue";
import StateEditor from "@/components/Editors/StateEditor.vue";
import MultiStateChooser from "@/components/MultiStateChooser.vue";
import { State,StateList } from "@API/State";
import rootState from "@API/RootState";
import ActionList from "@/components/Widgets/ActionList.vue";
import StateMethods from "../store/states";
import { buildEscapedObject } from "@API/SerializeUtils";
const statesModule = namespace("states");
type ValueOf<T> = T[keyof T];
// type State = ValueOf<StateMethods['states']>;
@Component({
  components: {
    ActionList,
    MultiStateChooser,
    Button,
    Toggle,
    Modal,
    StateEditor
  },
  model: {
    prop: "selectedState",
    event: "change"
  }
})
export default class StateComponent extends Vue {
  @Prop({ default: false })
  private canEditStates?: boolean;
  @Prop()
  private maxHeight?: number;
  @Prop({
    default: () => {
      return {};
    }
  })
  private presetableState!: any;

  get editedState() {
    if (this.selectedState && !this.selectedState.name.startsWith("__")) {
      return this.selectedState;
    }
    return this.stateList.currentState;
  }

  set selectedStateIdx(i: number) {
    if (this.selectedState && i === undefined) {
      this.stateList.setLoadedStateName("");
      return;
      // this.stateList.recallState(this.selectedState, 0);
    }

    // if (this.selectedState) {
    if (i >= 0 && i < this.stateNames.length) {
      this.stateList.recallStateNamed(this.stateNames[i], 1, true);
    }
  }
  get selectedStateIdx() {
    return this.stateNames.indexOf(
      this.selectedState ? this.selectedState.name : ""
    );
  }

  get linkableStateNames() {
    const n = this.selectedState ? this.selectedState.name : "";
    return this.stateNames.filter(e => e !== n);
  }

  public get linkedStateNames() {
    const res = new Array<string>();
    if (this.selectedState) {
      for (const l of this.selectedState.linkedStates) {
        res.push(l.name);
      }
    }
    return res;
  }

  public set linkedStateNames(v: string[]) {
    if (this.selectedState) {
      const stateNames = this.selectedState.linkedStates.map(e => ({
        name: e.name
      }));
      this.selectedState.setLinkedStates(stateNames);
    }
  }

  get linkedStateList() {
    return this.selectedState ? this.selectedState.linkedStates : [];
  }
  get actions() {
    return this.selectedState?.actions;
  }

  get selectedState(): State | undefined {
    return this.stateList.getStateNamed(this.stateList.loadedStateName);
  }

  @Watch("selectedState")
  em() {
    this.$emit("change", this.selectedState);
  }

  @statesModule.Mutation("saveCurrentState")
  public saveCurrentState!: StateMethods["saveCurrentState"];
  @statesModule.Mutation("removeState")
  public removeState!: StateMethods["removeState"];
  @statesModule.Mutation("renameState")
  public renameState!: StateMethods["renameState"];

  @statesModule.Mutation("recallState")
  public recallState!: StateMethods["recallState"];

  // @Prop({default:false})
  public showStateEditor = false; // !:boolean

  @statesModule.Getter("channels") private channels!: StateMethods["channels"];
  @statesModule.Getter("stateNames")
  private stateNames!: StateMethods["stateNames"];
  @statesModule.Getter("loadedStateName")
  private ploadedStateName!: StateMethods["loadedStateName"];
  
  private stateList = rootState.stateList as StateList;


  @Action("SAVE_SESSION") public SAVE_SESSION!: () => void;


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
  public processKey(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();

      if (key === "e" && this.editedState) {
        event.preventDefault();
        this.showStateEditor = !this.showStateEditor;
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (this.selectedStateIdx < this.stateNames.length - 1) {
          this.selectedStateIdx++;
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (this.selectedStateIdx > 0) {
          this.selectedStateIdx--;
        }
      }
      // const letter  =String.fromCharCode(event.which).toLowerCase();
    }
  }
  public editState() {
    if (this.selectedState !== null) {
      this.showStateEditor = true;
    }
  }

  get hasOneStatePreseted() {
    return this.stateList.presetableObjects.length > 0;
  }


  public saveNewState() {
    const name = prompt(
      "save or create new state",
      this.selectedState ? this.selectedState.name : ""
    );
    if (name !== null && name !== "") {
      
      
      this.stateList.saveFromPresetableNames(
        // this.stateList.saveFromPresetableObjects(
        name,
        this.stateList.namesFromPresetableState(this.presetableState),
        // this.stateList.getPresetableNames(),
        this.linkedStateList,
        this.actions
      );

      // save manually to ensure States are present on server
      this.SAVE_SESSION();

      // this.selectedState = this.stateList.getStateNamed(name);
    }
  }
  public removeStatePrompt() {
    const name = prompt(
      "remove state",
      this.selectedState ? this.selectedState.name : ""
    );
    if (name !== null && name !== "") {
      this.removeState({ name });
    }
  }

  public renameStatePrompt() {
    const oldName = this.selectedState ? this.selectedState.name : "";
    if (oldName) {
      const name = prompt("rename state " + oldName, oldName);
      if (name !== null && name !== "") {
        this.renameState({ oldName, newName: name });
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/*div{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
*/
div {
  width: 100%;
}
select {
  height: 100%;
  width: 100%;
  min-width: 20px;
}

.remove {
  background-color: red;
}
</style>
