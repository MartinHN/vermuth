<template>


  <div class="main"  style="width:100%;height:100%">
    <canvas ref="my-canvas" @mousedown="mouseDown" @mouseup="mouseUp" @mousemove="mo">
    </canvas>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
interface Point {x: number; y: number; }
interface Size {w: number; h: number; }
interface Rect {x: number; y: number; w: number; h: number; }

function distSq(a: Point, b: Point) {
  return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
function dist(a: Point, b: Point) {
  return Math.sqrt(distSq(a, b));
}
function invSize(s: Size) {
  return {w: 1 / Math.max(1, s.w), h: 1 / Math.max(1, s.h)};
}

function normPoint(p: Point, s: Size, o?: Point) {
  o = o || {x: 0, y: 0};
  return {x: (p.x - o.x) / s.w, y: (p.y - o.y) / s.h};
}
function mapPoint(p: Point, s: Size, o?: Point) {
  o = o || {x: 0, y: 0};
  return {x: p.x * s.w + o.x, y: p.y * s.h + o.y};
}
function getRectForPoint(p: Point, s: Size): Rect {
  return {x: p.x - s.w / 2, y: p.y - s.h / 2, w: s.w, h: s.h};
}
function getSquareForPoint(p: Point, s: number): Rect {
  return getRectForPoint(p, {w: s, h: s});
}
function getPointFromEvent(e: MouseEvent) {
  return {x: e.offsetX, y: e.offsetY};
}

@Component({})
export default class PointEditor extends Vue {

  get domSize() {
    const r = this.cnvDOM;
    return {w: r.width, h: r.height};
  }
  get canvasSize() {
    const r = this.cnvDOM;
    return {w: r.width, h: r.height};
  }
  get snapMouse() {
    return this.numPoints === 1;
  }
  get cnvDOM(): HTMLCanvasElement {
    return this.$refs['my-canvas'] as HTMLCanvasElement;
  }
  @Prop({default: 'red'})
  public pointColor !: string;

  private context: any;

  @Prop({default: 1})
  private numPoints!: number;
  @Prop({default: () => new Array<Point>()})
  private value !: Point[] ;

  private mousePressedIdx = -1;
  @Prop({default: 20})
  private pRadius !: number;
  public mouseToPct(m: Point) {return normPoint(m, this.domSize, {x: 0, y: 0}); }

  public mounted() {
    const c = this.cnvDOM;
    if (c.parentElement) {
      debugger;
      this.context = c.getContext('2d');
      c.width = c.parentElement.clientWidth;
      c.height = c.parentElement.clientHeight;
    }
    for ( let i = this.value.length ; i < this.numPoints ; i++) {
      this.value.push({x: 0, y: 0});
    }
    for (let i = 0 ; i < this.value.length ; i++) {
      this.setPointPosPct(i, this.value[i]);
    }
  }

  public mouseDown(e: MouseEvent) {
    const pSq = this.pRadius * this.pRadius;
    const m = getPointFromEvent(e);

    if (this.snapMouse) {
        this.mousePressedIdx = 0;
      } else {
        this.mousePressedIdx = this.value.findIndex((el) => distSq(el, m) < pSq);
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
    const oldPixPos = mapPoint(this.value[idx], this.canvasSize);
    const newPixPos = mapPoint(pos, this.canvasSize);
    const oldRect = getSquareForPoint(oldPixPos, this.pRadius);
    const newRect = getSquareForPoint(newPixPos, this.pRadius);
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
    this.$emit('input', this.value);
  }

}
</script>


<style scoped>
</style>