<template>
  <label
    :style="{ 'background-color': color }"
    :for="_uid"
    class="buttonPH unselectable"
    :tabindex="focusable ? -1 : ''"
    @click.prevent="$emit('click')"
    @mousedown.prevent="$emit('mousedown')"
  >
    <input
      :id="_uid"
      type="button"
      class="button"
      :tabindex="focusable ? -1 : ''"
    />

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <div
          v-on="tooltipText ? on : {}"
          style="
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
          "
          class
        >
          <v-icon v-for="i of iconList" :key="i.id">mdi-{{ i }}</v-icon>
          <div v-if="iconList.length === 0" class="nonClickable">
            {{ text }}
          </div>
        </div>
      </template>
      <span>{{ tooltipText }}</span>
    </v-tooltip>
  </label>
</template>

  <script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({})
export default class Button extends Vue {
  @Prop()
  public text?: string;
  @Prop({ default: false })
  public focusable?: boolean;
  @Prop({ default: "transparent" })
  public color?: string;
  @Prop({ default: "" })
  icon?: string | string[];
  @Prop({ default: "" })
  tooltip!: string;

  get iconList() {
    if (Array.isArray(this.icon)) {
      return this.icon;
    } else if (typeof this.icon === "string" && this.icon) {
      if (this.icon.includes(" ")) {
        return this.icon.split(" ");
      }
      return [this.icon];
    }
    return [];
  }

  get tooltipText() {
    return this.tooltip || (this.icon ? this.text : "");
  }
}
</script>


<style scoped>
input {
  height: 0px;
  display: none;
  position: fixed;
  left: -10000000px;
  /*  background-color: #4CAF50; 
  border: 2px solid #fff;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;*/
}
.nonClickable {
  pointer-events: none;
}
/*.buttonPH{
  
  
  margin: 5px;
  padding: 5px 10px 10px 20px;
  border: 2px solid #fff;
  border-radius: 10px;
  color: #fff;
  background-color:transparent;
  box-shadow: 0 0 20px rgba(0, 0, 0, .2);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color .2s, box-shadow .2s;
  }*/

.unselectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

label {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  /*padding: 5px 5px 5px 5px;*/
  border: 2px solid #fff;
  border-radius: 10px;
  color: #fff;
  background-color: transparent;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  /*white-space: nowrap;*/
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, box-shadow 0.2s;
  text-align: center;
  width: 100%;
}
</style>
