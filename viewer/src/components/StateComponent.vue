<template>
  <div class="main">
    <!-- States -->
    <select size="3" v-model="stateName" >
      <option v-for="n of stateNames" :key="n.id" :value="n">{{n}}</option>
    </select>
    <Button class="add" @click="saveNewState" text="s"></Button>
    <Button class="rename" @click="renameStatePrompt" text="r"></Button>
    <Button class="remove" @click="removeStatePrompt" text="-"></Button>


  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from './Button.vue';

import StateMethods from '../store/states';


const statesModule = namespace('states');
type ValueOf<T> = T[keyof T];
type State = ValueOf<StateMethods['states']>;
@Component({
  components: {Button},
})
export default class ChannelPatch extends Vue {

  @statesModule.Action('saveCurrentState') public saveCurrentState!: StateMethods['saveCurrentState'];
  @statesModule.Mutation('removeState') public removeState!: StateMethods['removeState'];
  @statesModule.Mutation('renameState') public renameState!: StateMethods['renameState'];
  
  @statesModule.Action('recallState') public recallState!: StateMethods['recallState'];

  @statesModule.Getter('channels') private channels!: StateMethods['channels'];
  @statesModule.Getter('stateNames') private stateNames!: StateMethods['stateNames'];
  @statesModule.State('stateName') private pStateName!: StateMethods['stateName'];

  get stateName(): string {
    return this.pStateName;
  }
  set stateName(v: string) {
    this.recallState({name: v});
  }
  public saveNewState() {
    const name = prompt('save new state', this.stateName);
    if (name === null || name === '') {} else {
        this.saveCurrentState({name});
      }
    }
    public removeStatePrompt() {
    const name = prompt('remove state', this.stateName);
    if (name === null || name === '') {} else {
        this.removeState({name});
      }
    }

    renameStatePrompt(){
    const name = prompt('rename state', this.stateName);
    if (name === null || name === '') {} else {
        this.renameState({oldName:this.stateName,newName:name});
      }
    }


  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
select{
  flex:1;
}

.remove{
  background-color: red;
}
</style>
