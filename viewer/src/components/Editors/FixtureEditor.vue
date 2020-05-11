
<template>

  <div class="main"  style="width:100%;">

    <!-- <div v-if='fixture!==null'> -->
  <!-- 
        <v-select v-if="!readonly"
        class=""
        :items="fixtureTypes"
        label="type"
        @change='setFixtureType($event)'
        ></v-select> -->
        <v-col  v-if="!readonly" cols=12 >
          <Button  class="button addChannel" color='green' @click="addChannelToFixture({fixture})" text="+ Chan."/>
        </v-col>
        <v-card>

          <v-data-table :items=fixture.channels  :headers=fixtureHeaders 
          hide-default-header
          hide-default-footer
          disable-pagination
          class="overflow-y-auto"
          style="max-height:300px"
          :dense="readonly===true"
          >

          <template v-slot:item="{item:c}">
            <tr>
              <td v-if="fixture.channels.length>1 && !readonly">
                <Button class="button removeChannel " color='red' @click="removeChannel({channel:c,fixture})" tabIndex="-1" text="-"></Button>
              </td>
              <td >

                <TextInput :editable="!readonly" type="text" :style="{width:'100%'}" class="channelName " @change="setChannelName({channel:c,name:$event.value})" :value="c.name"  ></TextInput>


              </td>
              <td>
              {{niceRole(c)}}



              <v-menu v-if="!readonly" open-on-hover bottom offset-y :close-on-content-click="false" :value="openedMenu===c.name" @input="openedMenu=c.name" >
                <template v-slot:activator="{ on }">
                  <v-btn
                    color="primary"
                    dark
                    v-on="on"
                  >
                    Role
                  </v-btn>
                </template>

                <v-list>
               
                <v-list-item   @click="setRoleFam(c,'auto','')" >auto</v-list-item>
                
                    <v-list-group
                      v-for="item in Object.keys(channelFamType)"
                      :key="item"
                      no-action
                    >
                      <template v-slot:activator>
                        <v-list-item>
                            {{ item }}
                        </v-list-item>
                      </template>

                      <v-list-item
                        v-for="subItem in channelFamType[item]"
                        :key="subItem"
                        @click="setRoleFam(c,item,subItem)"
                      >
                     {{ subItem }}
                      </v-list-item>
                    </v-list-group>
                  </v-list>
              </v-menu>
 
              </td>



              <td>
                <Numbox class="circNum" :value="c.circ" :min="0" :max="512" @input="linkChannelToCirc({channel: c, circ: $event})" :errMsg='c.hasDuplicatedCirc===true?"duplicated":""' :editable='!readonly'></Numbox>
              </td>

            </tr>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
    <!-- </div> -->


  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
import { State, Action, Getter , Mutation , namespace} from 'vuex-class';
import Button from '@/components/Inputs/Button.vue';
import Numbox from '@/components/Inputs/Numbox.vue';
import Toggle from '@/components/Inputs/Toggle.vue';
import TextInput from '@/components/Inputs/TextInput.vue';

import Modal from '@/components/Utils/Modal.vue';

import UniversesMethods from '../../store/universes';
import {FixtureBase} from '@API/Fixture';
import { FixtureFactory } from '@API/FixtureFactory';
const universesModule = namespace('universes');
import {ChannelRoles,ChannelBase} from "@API/Channel";

@Component({
  components: {Button, Numbox, Toggle, TextInput},
})
export default class FixtureEditor extends Vue {
  @Prop({default: null, required: true})
  public fixture !: FixtureBase | null;

  @Prop({default: false})
  public readonly ?: boolean;


 @universesModule.Mutation('linkChannelToCirc') public linkChannelToCirc!: UniversesMethods['linkChannelToCirc'];
  @universesModule.Mutation('setChannelName') public setChannelName!: UniversesMethods['setChannelName'];
  @universesModule.Mutation('removeChannel') public removeChannel!: UniversesMethods['removeChannel'];
  @universesModule.Mutation('addChannelToFixture') public addChannelToFixture!: UniversesMethods['addChannelToFixture'];

  public mounted() {

  }

  get fixtureTypes() {
    return FixtureFactory.getAllFixtureDefsTypeNames();
  }

  // public setFixtureType(type){
  //   console.log("setting fixture type",type)
  // }
  get fixtureHeaders() {
    return [{text: 'Name', value: 'name'},
    {text: 'Role', value: 'role'},
    {text: 'Offset', filterable: false},
    // ,{text:"edit",sortable:false},{text:"test",sortable:false}
    ];
  }

  get channelFamType(){
    const res : {[id:string]:string[]} = {}
    for(const [k,v ] of Object.entries(ChannelRoles)){
      res[k] = Array.from(Object.keys(v))
    }
    console.log(res)
    return res
  }

  setRoleFam(c:ChannelBase,f:string,t:string){
    c.setCustomFamType(f,t)
    this.closeAllMenus()
  }

  closeAllMenus(){
    this.openedMenu="";
  }

  
  niceRole(c:ChannelBase){
    const trueType =  `${c.roleFam}:${c.roleType}`
    if(!c.hasCustomFamType){
      return `(${trueType})`
    }
    return trueType
  }

  openedMenu = ""



}
</script>


<style scoped>
</style>