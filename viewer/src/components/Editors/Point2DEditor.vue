<template>
  <div class="main" style="width: 100%; height: 100%">
    <canvas
      ref="my-canvas"
      @mousedown="mouseDown"
      @mouseup="mouseUp"
      @mousemove="mo"
    ></canvas>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Point, Rect, Size } from "@API/Utils2D";

function getPointFromEvent(e: MouseEvent): Point {
  return new Point(e.offsetX, e.offsetY);
}

@Component({})
export default class PointEditor extends Vue {
  get domSize(): Size {
    const r = this.cnvDOM;
    return new Size(r.width, r.height);
  }
  get canvasSize(): Size {
    const r = this.cnvDOM;
    return new Size(r.width, r.height);
  }
  get snapMouse() {
    return this.numPoints === 1;
  }
  get cnvDOM(): HTMLCanvasElement {
    return this.$refs["my-canvas"] as HTMLCanvasElement;
  }
  @Prop({ default: "red" })
  public pointColor!: string;

  private context: any;

  @Prop({ default: 1 })
  private numPoints!: number;
  @Prop({ default: () => new Array<Point>() })
  private value!: Point[];

  private mousePressedIdx = -1;
  @Prop({ default: 20 })
  private pRadius!: number;

  @Prop({ default: false })
  private invertX!: boolean;
  @Prop({ default: false })
  private invertY!: boolean;
  public mouseToPct(m: Point) {
    const mp = this.domSize.normPoint(m);
    return mp;
  }

  public mounted() {
    const c = this.cnvDOM;
    if (c.parentElement) {
      debugger;
      this.context = c.getContext("2d");
      c.width = c.parentElement.clientWidth;
      c.height = c.parentElement.clientHeight;
    }
    for (let i = this.value.length; i < this.numPoints; i++) {
      this.value.push(new Point(0, 0));
    }
    for (let i = 0; i < this.value.length; i++) {
      const mp = this.value[i];
      this.setPointPosPct(i, mp);
    }
  }

  public mouseDown(e: MouseEvent) {
    const pSq = this.pRadius * this.pRadius;
    const mp = getPointFromEvent(e);
    if (this.invertX) mp.x = 1 - mp.x;
    if (this.invertY) mp.y = 1 - mp.y;
    if (this.snapMouse) {
      this.mousePressedIdx = 0;
    } else {
      this.mousePressedIdx = this.value.findIndex((el) => mp.distSq(el) < pSq);
    }
  }
  public mouseUp(e: MouseEvent) {
    this.mousePressedIdx = -1;
  }
  public mo(e: MouseEvent) {
    if (this.mousePressedIdx >= 0) {
      const pos = this.mouseToPct(getPointFromEvent(e));
      this.setPointPosPct(this.mousePressedIdx, pos);
    }
  }

  public setPointPosPct(idx: number, pos: Point) {
    const ctx = this.context;
    const mp = this.value[idx];
    if (this.invertX) mp.x = 1 - mp.x;
    if (this.invertY) mp.y = 1 - mp.y;
    const oldPixPos = this.canvasSize.mapPoint(mp);
    const newPixPos = this.canvasSize.mapPoint(pos);
    const oldRect = Rect.getSquareForPoint(oldPixPos, this.pRadius);
    const newRect = Rect.getSquareForPoint(newPixPos, this.pRadius);
    ctx.beginPath();
    // Clear the old area from the previous render.
    ctx.clearRect(oldRect.x, oldRect.y, oldRect.w, oldRect.h);

    ctx.arc(newPixPos.x, newPixPos.y, newRect.w / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.pointColor;
    ctx.fill();

    // Draw the text
    // ctx.fillStyle = '#000'
    // ctx.font = '28px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.fillText(Math.floor(this.value), (newBox.x + (newBox.w / 2)), newBox.y - 14)

    this.value[idx] = pos;
    if (this.invertX) this.value[idx].x = 1 - pos.x;
    if (this.invertY) this.value[idx].y = 1 - pos.y;
    this.$emit("input", this.value);
  }
}
</script>


<style scoped>
</style>
