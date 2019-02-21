<template>
  <div class="WidgetPlaceHolder">
    <div ref="Widget"></div>
    <div ref="Value" v-if="showValue">{{valToString}}</div>
    <div ref="Name" v-if="showName">{{name}}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
// import ui:any from 'nexusui' ;
const ui: any = require('nexusui');


@Component({})
export default  class Widget extends Vue  {
  @Prop() public  name!: string;
  @Prop({default: 'Slider'})   public type!: string;
  @Prop({default: false})    public showName?: boolean;
  @Prop({default: false})    public showValue?: boolean;
  @Prop() public options?: any;
  @Prop({default: 2})  public precision?: number;
  @Prop() public valuestore?: any  ;
  public value: any = {};
  public lastValue: any = {};
  private widgetObj: any = {};

  public mounted() {

    this.widgetObj = new ui[this.$props.type]({target: this.$refs.Widget, ...this.options}); // "#"+this._uid)=
    if (this.options && this.options.initial) {
      this.widgetObj.value = this.options.initial;
    } else if (this.valuestore && typeof this.valuestore === typeof this.widgetObj.value) {
      this.widgetObj.value = this.valuestore;
    }
    this.value = this.getInitialValue(this.widgetObj);
    const vcomponent = this;
    this.widgetObj.on('change', (v: any) => {
      if (v.state !== undefined) {vcomponent.value = v.state; } else {vcomponent.value = v; }
      if (vcomponent.value !== vcomponent.lastValue) {
        vcomponent.$emit('value-change', {source: vcomponent, value: v});
        vcomponent.lastValue = vcomponent.value;
      }

    });
  }


  @Watch('valuestore')
  public watchValue(val: any, oldVale: any) {
    debugger;
    if(val!=this.widgetObj.value)this.widgetObj.value = val;
  }

    @Watch('options')
  public watchOption(val: any, oldVale: any) {
    // used for select in nexus ui
    if (val.options && this.widgetObj.defineOptions) {
      this.widgetObj.defineOptions(val.options);
    }
}
    @Watch('value')
  public watchValue(val: any, oldVale: any) {
    // used for select in nexus ui
debugger


  }


  get valToString(): string {
    // if (this.value || this.value === {}) {return 'none'; }
    if (typeof this.value === 'number') {
      return this.value.toFixed(this.precision);
    } else {
      return JSON.stringify(this.value);
    }
  }


  private getInitialValue(w: any): any | undefined {
    return w.value;
  }
  // if (w._state !== undefined) {return w._state.state; }
  // if (w._value !== undefined) {
  //     if (w._value.value !== undefined) {return w._value.value; } else                          {return w._value; }
  //   }
  // }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
.widgetName {
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
