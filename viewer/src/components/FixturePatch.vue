<template>
  <div class="main">
    FixturePatch
    <br/>
    <v-container class="FixturePatch" fluid>
      <v-row>
        <v-col cols=8 >
          <Button class="button" @click="showFixtureExplorer=true" text="add Fixture"/>
          <Modal v-if="showFixtureExplorer" @close="showFixtureExplorer=false">

            <!-- <h3 slot="header">fixture Explorer</h3> -->
            <FixtureExplorer  slot="body" @change="addAndQuitFExplorer($event) "></FixtureExplorer>

          </Modal>
        </v-col>

        <v-col cols=2 >
          <Numbox style=width:30px class="testNum" name="testChannel" showName="1" @input="!!$event.value && testDimmerNum(parseInt($event.value))" :value="testDimmerNumVal" />
        </v-col>
      </v-row>
      <!-- <v-row  v-for="f in universe.sortedFixtureList" :key="f.name" style="background-color:#FFF5;margin:5px" no-gutters>
      -->
    </v-container>
    <v-card>
      <v-text-field
      v-model="searchFixtureText"
      append-icon="search"
      label="Search"
      single-line
      hide-details
      ></v-text-field>
      <v-data-table :items=universe.sortedFixtureList  
      :headers=fixtureHeaders  
      :search="searchFixtureText"
      hide-default-footer
      disable-pagination
      >
      <!-- <template v-slot:header="{props:headers}">
        <tr>
          <th
          v-for="header in headers.headers"
          :key="header.text"
          >
          {{ header.text }}
        </th>
      </tr>
    </template> -->
    <template v-slot:item="{item:f}">
      <tr>
        <td>
          <input :style="{'background-color':'#0003','width':'100%'}" :value="f.name" @change="setFixtureName({fixture:f,value:$event.target.value})"/>
        </td>
        <td>
          <Numbox :errMsg="fixtureErrorMsgs[f.name]" class="baseCirc pa-0 ma-0" :value="f.baseCirc" :min="0" :max="512" @input="$event.value && setFixtureBaseCirc({fixture: f, circ:$event.value})"></Numbox>
        </td>
        <td>
         {{f.ftype}} ({{f.span}} ch)
       </td>
       <td>
        <Button class=" removeFixture " color='red' @click="removeFixture({fixture:f})" tabIndex="-1" text="-"/>
      </td>
      <td>
        <Button text="edit" class="button pa-0 ma-0" @click='editedFixture = f'/>
      </td>
      <td>
        <Toggle v-if='f.dimmerChannels && f.dimmerChannels.length ' text="test" :value="universe.testedChannel.circ===f.dimmerChannels[0].trueCirc" @input=testDimmerNum($event?f.dimmerChannels[0].trueCirc:-1) > T </Toggle>
      </td>
    </tr>
  </v-row>
</template>
</v-data-table>
<!-- 
</v-row>-->
</v-card>

<Modal v-if="editedFixture!==null" @close="editedFixture=null">

  <h3 slot="header">fixture Editor</h3>
  <FixtureEditor  slot="body" :fixture=editedFixture></FixtureEditor>

</Modal>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';


import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import Modal from '@/components/Utils/Modal.vue';
import FixtureEditor from '@/components/Editors/FixtureEditor.vue';
import FixtureExplorer  from '@/components/Editors/FixtureExplorer.vue';
import { DirectFixture,FixtureBase } from '@API/Fixture';
import { FixtureFactory } from '@API/FixtureFactory';
import UniversesMethods from '../store/universes';


const universesModule = namespace('universes');

@Component({
  components: {Button, Numbox, Toggle, Modal, FixtureEditor,FixtureExplorer},
})
export default class FixturePatch extends Vue {
  public get fixtureErrorMsgs() {
    // const dum = this.usedChannels
    const errs: {[id: string]: string} = {};
    for (const f of Object.values(this.universe.fixtures)){
      const overlap  = []
      for (const ff of Object.values(this.universe.fixtures)){
        if(f!=ff){
          const o= (f.baseCirc>=ff.baseCirc &&f.baseCirc<=ff.endCirc ) ||
          (f.endCirc>=ff.baseCirc &&f.endCirc<=ff.endCirc )
          if(o){
            overlap.push(ff.name)
          }
        }
      }
      if(overlap.length){
        errs[f.name]="overlap with "+overlap.join(",")
      }
    }
    return errs;
  }

  get fixtureColors(){
    const cols:{[id:string]:string} ={}
    for(const f of Object.values(this.universe.fixtures)){
       cols[f.name] = this.fixtureErrorMsgs[f.name]?"red":"inherit"
    }
    return cols
  }

  get fixtureHeaders() {
    return [{text: 'Name', value: 'name'},
    {text: 'Dimmer', value: 'baseCirc'},
    {text: 'Type', value: 'ftype'},
    {text: 'Actions', sortable: false, filterable: false},
    // ,{text:"edit",sortable:false},{text:"test",sortable:false}
    ];
  }


  public editedFixture = null;
  addAndQuitFExplorer(e:FixtureBase){
   this.showFixtureExplorer=false
   if(e){
    e.name = e.fixtureType
    this.universe.addFixture(e)
  }
}
@universesModule.Mutation('addFixture') public addFixture!: UniversesMethods['addFixture'];
@universesModule.Mutation('duplicateFixture') public duplicateFixture!: UniversesMethods['duplicateFixture'];

@universesModule.Mutation('setFixtureBaseCirc') public setFixtureBaseCirc!: UniversesMethods['setFixtureBaseCirc'];




@universesModule.Mutation('linkChannelToCirc') public linkChannelToCirc!: UniversesMethods['linkChannelToCirc'];
@universesModule.Mutation('setChannelName') public setChannelName!: UniversesMethods['setChannelName'];
@universesModule.Mutation('removeChannel') public removeChannel!: UniversesMethods['removeChannel'];

@universesModule.Mutation('removeFixture') public removeFixture!: UniversesMethods['removeFixture'];
@universesModule.Mutation('setFixtureName') public setFixtureName!: UniversesMethods['setFixtureName'];

@universesModule.Getter('testDimmerNumVal') public testDimmerNumVal!: UniversesMethods['testDimmerNumVal'];
@universesModule.Mutation('testDimmerNum') public testDimmerNum!: UniversesMethods['testDimmerNum'];

@universesModule.State('universe') private universe!: UniversesMethods['universe'];




@universesModule.Getter('usedChannels') private usedChannels!: UniversesMethods['usedChannels'];

private searchFixtureText = '';
private showFixtureExplorer = false
public open() {
  // debugger
}
public close() {
  debugger;
}


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>
.box {
  box-shadow: 0 0 4pt rgba(0, 0, 0, 0.25);
  border-radius: 20pt;
  background-color: rgba(255, 255, 255, 0.25);
  user-select: none;
  cursor: context-menu;
}
</style>
