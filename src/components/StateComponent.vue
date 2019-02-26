<template>
  <div class="main">
    <!-- States -->
    <select visible="3" v-model="stateName" >
      <option v-for="n of stateNames" :key="n.id" :value="n">{{n}}</option>
    </select>
    <Button class="add" @click="saveNewState" text="s"></Button>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from './Button.vue'

import StateMethods from '../store/states';


const statesModule = namespace('states');
type ValueOf<T> = T[keyof T];
type State = ValueOf<StateMethods['states']>
@Component({
  components: {Button},
})
export default class ChannelPatch extends Vue {

  @statesModule.Action('saveCurrentState') public saveCurrentState!: StateMethods['saveCurrentState'];
  @statesModule.Action('recallState') public recallState!: StateMethods['recallState'];
  
  @statesModule.Getter('channels') private channels!: StateMethods['channels'];
  @statesModule.Getter('stateNames') private stateNames!: StateMethods['stateNames'];
  @statesModule.State('stateName') private _stateName!: StateMethods['stateName'];

  get stateName():string{
    return this._stateName
  }
  set stateName(v:string){
    this.recallState({name:v})
  }
  saveNewState(){
    let name= prompt("save new state","state")
    if (name == null || name == "") {} 
      else {
        this.saveCurrentState({name});
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
</style>
