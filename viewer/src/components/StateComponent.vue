<template>
  
  <div>
    <v-row no-gutters >
      <v-col cols=6 >
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
      <v-col >
        <div id="stateActions">
          <Button class="add" @click="saveNewState" text="save"></Button>
          <Button v-if="selectedState && !selectedState.name.startsWith('__')"  class="edit" @click="editState" text="edit"></Button>
          <Button class="rename" @click="renameStatePrompt" text="rename"></Button>
          <Button class="remove" @click="removeStatePrompt" text="-" color='red'></Button>
          <v-select label=linkedStates multiple  v-model="linkedStateNames" style="width:100%" :items=linkableStateNames>
            <template v-slot:item="{item:item}">
              {{item}}
            </template>
          </v-select>

        </div>
      </v-col>

    </v-row>

    <Modal v-if=showStateEditor @close="showStateEditor=false">
      <h3  slot="header" >StateEditor : {{editedState?editedState.name:"no state"}}</h3>
      <StateEditor  slot="body" :state=editedState></StateEditor>
    </Modal>
    <!-- </v-container> -->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import {  Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue';
import StateEditor from '@/components/Editors/StateEditor.vue';
import {LinkedState, State} from '@API/State';
import rootState from '@API/RootState';

import StateMethods from '../store/states';


const statesModule = namespace('states');
type ValueOf<T> = T[keyof T];
// type State = ValueOf<StateMethods['states']>;
@Component({
  components: {Button, Toggle, Modal, StateEditor},
})
export default class StateComponent extends Vue {

  public mounted(){
       window.addEventListener('keydown',this.processKey)

  }
  public destroyed(){
    window.removeEventListener('keydown',this.processKey)
  }
  public processKey(event:KeyboardEvent){
    if (event.ctrlKey || event.metaKey) {
      const letter = String.fromCharCode(event.which).toLowerCase()
      if(letter==='e'){
        
      }
      else if(event.key==="ArrowDown"){
        event.preventDefault()
        if(this.selectedStateIdx<this.stateNames.length-1){this.selectedStateIdx++;}
      }
      else if(event.key==="ArrowUp"){
        event.preventDefault()
       if(this.selectedStateIdx>0){this.selectedStateIdx--;}
      }
      // const letter  =String.fromCharCode(event.which).toLowerCase();
      
    }
  }

  get editedState() {
    return this.selectedState;
  }

  public selectedState: State | null = null;

  set selectedStateIdx(i: number) {
    if (this.selectedState && i === undefined) {this.stateList.recallState(this.selectedState, 0); }
    this.selectedState = this.stateList.getStateNamed(this.stateNames[i]);
    if (this.selectedState) {this.stateList.recallState(this.selectedState, 1); }
  }
  get selectedStateIdx() {
    return this.stateNames.indexOf(this.selectedState ? this.selectedState.name : '');

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

  get linkableStateNames() {
    const n = this.selectedState ? this.selectedState.name : '';
    return this.stateNames.filter((e) => e !== n);
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
      const res = v.map((e) => new LinkedState(e, 1));
      this.selectedState.linkedStates = res;
      // this.stateList.recallState(this.selectedState,1)
    }
  }

  get linkedStateList() {
    return this.linkedStateNames.map((e) => new LinkedState(e, 1));
  }
  public editState() {
    if (this.selectedState == null ) {

    } else {
      this.showStateEditor = true;
    }
  }

  public saveNewState() {
    const name = prompt('save new state', this.selectedState ? this.selectedState.name : '');
    if (name === null || name === '') {} else {
      this.stateList.saveCurrentState(name, this.linkedStateList);
      this.selectedState = this.stateList.getStateNamed(name);
    }
  }
  public removeStatePrompt() {
    const name = prompt('remove state', this.selectedState ? this.selectedState.name : '');
    if (name === null || name === '') {} else {
      this.removeState({name});
    }
  }

  public renameStatePrompt() {
    const oldName = this.selectedState ? this.selectedState.name : '';
    if (oldName) {
      const name = prompt('rename state ' + oldName, oldName );
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
