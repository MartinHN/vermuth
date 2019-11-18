<template>
  <!-- <v-container class="main" fluid pa-1> -->
    <v-row no-gutters >
      <v-col cols=10 >
        <v-list dense class="overflow-y-auto" style=max-height:200px >
          <!-- <v-subheader>Presets</v-subheader> -->
          <v-list-item-group v-model="selectedPreset" > <!-- v-model="item" color="primary"> -->
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
          <Button class="rename" @click="renameStatePrompt" text="rename"></Button>
          <Button class="remove" @click="removeStatePrompt" text="-" color='red'></Button>


        </div>
      </v-col>

    </v-row>
  <!-- </v-container> -->

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Toggle from '@/components/Inputs/Toggle.vue';

import StateMethods from '../store/states';


const statesModule = namespace('states');
type ValueOf<T> = T[keyof T];
// type State = ValueOf<StateMethods['states']>;
@Component({
  components: {Button, Toggle},
})
export default class StateComponent extends Vue {

  @statesModule.Mutation('saveCurrentState') public saveCurrentState!: StateMethods['saveCurrentState'];
  @statesModule.Mutation('removeState') public removeState!: StateMethods['removeState'];
  @statesModule.Mutation('renameState') public renameState!: StateMethods['renameState'];

  @statesModule.Mutation('recallState') public recallState!: StateMethods['recallState'];

  @statesModule.Getter('channels') private channels!: StateMethods['channels'];
  @statesModule.Getter('stateNames') private stateNames!: StateMethods['stateNames'];
  @statesModule.Getter('loadedStateName') private pStateName!: StateMethods['loadedStateName'];



  get stateName(): string {
    return this.pStateName;
  }
  set stateName(v: string) {
    if (v  ) {
      this.recallState({name: v});
    }
  }


  set selectedPreset(i: number) {
    this.stateName = this.stateNames[i];
  }
  get selectedPreset() {
    return this.stateNames.indexOf(this.stateName);
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

  public renameStatePrompt() {
    const name = prompt('rename state', this.stateName);
    if (name === null || name === '') {} else {
      this.renameState({oldName: this.stateName, newName: name});
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
