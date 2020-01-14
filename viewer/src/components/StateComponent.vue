<template>
  <!-- <v-container class="main" fluid pa-1> -->
    <div>
    <v-row no-gutters >
      <v-col cols=10 >
        <v-list dense class="overflow-y-auto" style=max-height:200px >
          <!-- <v-subheader>Presets</v-subheader> -->
          <v-list-item-group v-model="selectedStateIdx" > <!-- v-model="item" color="primary"> -->
            <v-list-item v-for="(s,i) in stateNames" :key=s.id>
              <v-list-item-content >
                <v-list-item-title v-html="s" ></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
      <v-col cols=2>
        <div id="stateActions">
          <Button class="add" @click="saveNewState" text="save"></Button>
          <Button class="edit" @click="editState" text="edit"></Button>
          <Button class="rename" @click="renameStatePrompt" text="rename"></Button>
          <Button class="remove" @click="removeStatePrompt" text="-" color='red'></Button>


        </div>
      </v-col>

    </v-row>

    <Modal v-if=showStateEditor @close="showStateEditor=false">
      <h3  slot="header" >StateEditor</h3>
     <StateEditor  slot="body" :state=selectedState></StateEditor>
    </Modal>
  <!-- </v-container> -->
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue';
import StateEditor from '@/components/Editors/StateEditor.vue';

import rootState from '@API/RootState';

import StateMethods from '../store/states';


const statesModule = namespace('states');
type ValueOf<T> = T[keyof T];
// type State = ValueOf<StateMethods['states']>;
@Component({
  components: {Button, Toggle, Modal, StateEditor},
})
export default class StateComponent extends Vue {

  get calledStateNames(): string[] {
    return [this.ploadedStateName];
  }
  set calledStateNames(v: string[]) {
    if (v  ) {
      rootState.stateList.recallStatesNamed(v)
      // this.recallState({name: v});
    }
  }

  get firstSelectedState(){
    if(this.selectedStates.length>0)
    {return this.selectedStates[0]}

  }

  get selectedStates() {
    return this.calledStateNames.map(s=>this.stateList.getStateNamed(s));
  }
  set selectedStateIdxs(is: number[]) {
    
    if (this.calledStateNames && is) {
    this.calledStateNames = is.map(i=>this.stateNames[i]);
    }
  }
  get selectedStateIdxs() {
    return this.stateNames.map(s=>this.stateNames.indexOf(s));
  }

  set selectedStateIdx(i:number){
    this.selectedStateIdxs = [i]
  }
  get selectedStateIdx(){
    return this.selectedStateIdxs?this.selectedStateIdxs[0]:-1
    
  }
  @statesModule.Mutation('saveCurrentState') public saveCurrentState!: StateMethods['saveCurrentState'];
  @statesModule.Mutation('removeState') public removeState!: StateMethods['removeState'];
  @statesModule.Mutation('renameState') public renameState!: StateMethods['renameState'];

  @statesModule.Mutation('recallState') public recallState!: StateMethods['recallState'];

  // @Prop({default:false})
  public showStateEditor = false; // !:boolean

  @statesModule.Getter('channels') private channels!: StateMethods['channels'];
  @statesModule.Getter('stateNames') private stateNames!: StateMethods['stateNames'];
  @statesModule.Getter('loadedStateName') private ploadedStateName!: StateMethods['loadedStateName'];


  private stateList = rootState.stateList;



  public editState() {
    if (this.selectedStates == null || this.selectedStates.length==0) {

    } else {
      this.showStateEditor = true;
    }
  }

  public saveNewState() {
    const name = prompt('save new state', this.firstSelectedState?this.firstSelectedState.name:"");
    if (name === null || name === '') {} else {
      this.saveCurrentState({name});
    }
  }
  public removeStatePrompt() {
    const name = prompt('remove state', this.firstSelectedState?this.firstSelectedState.name:"");
    if (name === null || name === '') {} else {
      this.removeState({name});
    }
  }

  public renameStatePrompt() {
    const oldName = this.firstSelectedState?this.firstSelectedState.name:""
    if(oldName){
    const name = prompt('rename state '+oldName,oldName );
    if (name === null || name === '') {} else {
      this.renameState({oldName, newName: name});
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
div{
  width:100%;
}
select{
  height:100%;
  width:100%;
  min-width: 20px;
}

.remove{
  background-color: red;
}
</style>
