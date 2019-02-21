<template>
  <div class="Widgetrack">
    <widget v-for="w in widgets" @value-change="widgetChanged($event)" :key="w.id" :name="w.name" :type="w.type" :showName="showNames" :showValue="showValues"></widget>
    <widget type="Toggle" name="showNames" :showName="true" @value-change="showNames=$event" ></widget> 
    <widget type="Toggle" name="showValues" :showName="true" @value-change="showValues=$event" ></widget> 
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Widget from './Widget.vue' ;


@Component({
  components: {Widget},
})
export default class WidgetRack extends Vue {


  private showNames = false;
  private showValues = true;

  private widgets = new Array<Widget>();

}


// const cusd: DirectiveOptions ={
  //   inserted: function (el, binding, vnode) {
    //     console.log('My Element is:', vnode.elm);
    //     console.log('My componentInstance is:', vnode.componentInstance);
    //     console.log('My Vue Instance is:', vnode.context);
    //   }
    // }
</script>

  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  .rack {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: gray;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    display: inline-block;
    margin: 0 10px;
  }
  a {
    color: #42b983;
  }
</style>
