<template>


  <div class="main"  style="width:100%;height:100%">

    <Slider text="start" v-model=positionRange.start min=0 :max=curve.span-10></Slider>
    <Slider text="end" v-model=positionRange.end min=10 :max=curve.span+10></Slider>

    <svg ref=my-svg width=100% height=100% @mousedown="mouseDown" @mouseup="mouseUp" @mousemove="mouseMove">

      <circle  v-for="v in displayedKeyFrames" :key=v.id ref='framesCircles' :r="pRadius" :cx="posToPix(v.position)" :cy='valToPix(v.value)' :fill="v===hoveredKeyFrameCircle?'blue':v===selectedKeyFrame?'red':'black'"></circle>

      <!-- <path :d=drawnPath stroke=black fill=transparent stroke-width=3></path> -->
      <path v-for="v in displayedKeyFramePairs" :key=v.id :d=buildSegment(v) stroke=black fill=transparent stroke-width=3></path>
      
      <circle v-if=hoveredKeyFrame :cx=hoveredPosValPix.x :cy=hoveredPosValPix.y fill=blue :r=pRadius></circle>

      <path :d=positionPath stroke=black fill=transparent stroke-width=1></path>

      <path :d=curValuePath stroke="black" stroke-dasharray="4,1" fill="transparent" stroke-width="1"></path>

      <g v-if='selectedKeyFrame && selectedKeyFrame.easing.constructor.typeName=="bz"' fill=transparent stroke=blue>
        <circle :cx=firstHandlePix.x :cy=firstHandlePix.y r=6  ></circle>
        <circle :cx=secondHandlePix.x :cy=secondHandlePix.y r=6 ></circle>
        <line :x1=posToPix(selectedKeyFrame.position) :y1=valToPix(selectedKeyFrame.value) :x2=firstHandlePix.x :y2=firstHandlePix.y></line>
        <line :x1=posToPix(nextSelectedKeyFrame.position) :y1=valToPix(nextSelectedKeyFrame.value) :x2=secondHandlePix.x :y2=secondHandlePix.y></line>
      </g>
    </svg>
    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
import { Point, Rect, Size } from '@API/Utils2D';
import { Curve, KeyFrame } from '@API/Curve';
import { BezierEasing,EasingFactory } from '@API/Easings/easings';
import Slider from '@/components/Inputs/Slider.vue';
import * as CurveUtils from './CurveEditorUtils';

function getPointFromEvent(e: MouseEvent): Point {return new Point( e.offsetX,  e.offsetY); }

function secondaryEvent(e:MouseEvent){return e.metaKey}

class Draggable{
  constructor(public jsObj:any){}
  public hovered=false;
  public selected=false;
  public location = new Point(0,0);
  public order = 0;
  public isOver(p:Point){return false}//to override
  

}

class DraggableHandler{
  constructor(){}
  mouseDown(p:Point){
    const dr = this.findDraggableForPoint(p)
    if(dr!=this.clickedDraggable){
      if(this.clickedDraggable){this.clickedDraggable.selected=false;}
      this.clickedDraggable = dr;
      if(this.clickedDraggable){this.clickedDraggable.selected=true;}
    }
  }
  mouseMove(p:Point){
    if(this.clickedDraggable===undefined){
      const dr = this.findDraggableForPoint(p);
      if(dr!=this.hoveredDraggable){
        if(this.hoveredDraggable){this.hoveredDraggable.hovered=false;}
      this.hoveredDraggable = dr;
      if(this.hoveredDraggable){this.hoveredDraggable.hovered=true;}
      }
    }
    else{
      this.clickedDraggable.location=p;
    }
  }
  mouseUp(p:Point){
    if(this.clickedDraggable!==undefined){
      // this.clickedDraggable.selected = false
      this.clickedDraggable = undefined;
    }
    
  }

  findDraggableForPoint(p:Point){
    let dr :Draggable | undefined = undefined
    for(const d of this.draggables){
      if(d.isOver(p) && (!dr || d.order>=dr.order)){
        dr = d;
      }
    }
    return dr;
  }

  // add(d:Draggable){this.draggables.push(d);}
  // remove(d:Draggable){const i = this.draggables.indexOf(d);if(i>=0){this.draggables.splice(i,1)};}

  public draggables = new Array<Draggable>()
  private hoveredDraggable :Draggable | undefined = undefined
  private clickedDraggable :Draggable | undefined = undefined

}
const dH = new DraggableHandler()

@Component({components: {Slider}})
export default class CurveEditor extends Vue {

  get domSize(): Size {
    const dom = this.svgDOM;
    const hasMountedDOM  = dom.clientWidth > 0;
    return new Size(hasMountedDOM ? dom.clientWidth : 10 , hasMountedDOM ? dom.clientHeight : 10);
  }


  get displayedKeyFrames(): Array<KeyFrame<number>> {
    return this.curve.frames.filter((v) => this.positionRange.inRange(v.position));
  }

  get displayedKeyFramePairs(): Array<[KeyFrame<number>, KeyFrame<number>]> {
    return CurveUtils.getDisplayedKeyFramePairs(this.curve,this.positionRange);
  }
  

  get positionPath() {
    return ['M', this.posToPix(this.curve.position), 0, 'V', this.domSize.h].join(' ');
  }
  get curValuePath() {
    return ['M', 0, this.valToPix(this.curve.value as number), 'H', this.domSize.w].join(' ');
  }
  public positionRange = new CurveUtils.Range(0, 1000);

  public valueRange = new CurveUtils.Range(0, 1);


  @Prop({default: () => new Curve<number>()})
  private curve !: Curve<number> ;

  @Prop({default: 8})
  private pRadius !: number;

  private svgDOM: SVGGraphicsElement = {clientWidth: 10, clientHeight: 10} as SVGGraphicsElement;



  private value = 0;
  private mousePressedKeyFrame: KeyFrame<number>|null=null ;
  private hoveredKeyFrame: KeyFrame<number>|null = null;
  private hoveredKeyFrameCircle: KeyFrame<number>|null = null;
  private selectedKeyFrame: KeyFrame<number>|null = null;
  private hoveredPosValPix: Point = new Point(0,0);
  
  get draggableKeyPoints():Array<Draggable>{
    return this.displayedKeyFrames.map(
      (k:KeyFrame<number>):Draggable=>{
        const d =  new Draggable(
          k
          // ,(p:Point)=>{return this.posValToPix(k).distSq(p)<this.pRadius}
          );
        d.isOver=(p:Point)=>{return d.location.distSq(p)<this.pRadius}
        Object.defineProperty(d,"location",{
          get:()=>this.posValToPix(k),
          set:(p:Point)=>{
            const pv = this.pixToPosVal(p);
            k.position=pv.x;k.value=pv.y;}
        })
        return d;
      }
      ) 
  }

  get allDraggables(){
    let res  =new Array<Draggable>()
    res = res.concat(this.draggableKeyPoints)

    return res;
  }
  
  get nextSelectedKeyFrame(){
    if(this.selectedKeyFrame){
      return this.curve.getNextKeyFrame(this.selectedKeyFrame);
    }
  }
  
  private get firstHandlePix(){
    if(!this.selectedKeyFrame){return new Point (-1,-1);}
    const cur = this.selectedKeyFrame;
    const next = this.nextSelectedKeyFrame
    if(!next){return new Point (-1,-1);}
    const curPix = this.posValToPix(cur)
    const nextPix = this.posValToPix(next)
    const PA = (this.selectedKeyFrame.easing as BezierEasing).getPA(curPix.x,curPix.y,nextPix.x,nextPix.y);
    const res  =  new Point(PA[0],PA[1])
    return res;
  }

  private get secondHandlePix(){
    if(!this.selectedKeyFrame){return new Point (-1,-1);}
    const cur = this.selectedKeyFrame;
    const next = this.curve.getNextKeyFrame(this.selectedKeyFrame);
    if(!next){return new Point (-1,-1);}
    const curPix = this.posValToPix(cur)
    const nextPix = this.posValToPix(next)
    const P = (this.selectedKeyFrame.easing as BezierEasing).getPB(curPix.x,curPix.y,nextPix.x,nextPix.y);
    const res  =  new Point(P[0],P[1])
    return res;
  }
  private set firstHandlePix(p:Point){
    if(!this.selectedKeyFrame){return ;}
    const cur = this.selectedKeyFrame;
    const next = this.curve.getNextKeyFrame(this.selectedKeyFrame);
    if(!next){return;}
    const curPix = this.posValToPix(cur)
    const nextPix = this.posValToPix(next)
    const da:Point = p.csub(curPix).div(nextPix.csub(curPix));
    (this.selectedKeyFrame.easing as BezierEasing).setAHandle(da.x,da.y)
  }
  
  private hasDragged = false

  public buildSegment(pair: [KeyFrame<number>, KeyFrame<number>]) {
    return CurveUtils.buildPathForFrames(pair[0], pair[1], this.positionRange, this.valueRange, this.domSize);
  }





  public mounted() {
    this.svgDOM =  this.$refs['my-svg'] as SVGGraphicsElement;
    dH.draggables = this.allDraggables
    this.curve.add(new KeyFrame<number>(0, 0, new BezierEasing()));
    this.curve.add(new KeyFrame<number>(100, 0.5));
    this.curve.add(new KeyFrame<number>(200, 1));
    this.curve.autoDuration();
  }

  public pixToPosVal(p: Point, absolutePoint= true) {
    return CurveUtils.pixToPosVal(p, this.domSize, this.positionRange, this.valueRange, absolutePoint);
  }
  public posValToPix(pv:KeyFrame<number>) {
    return CurveUtils.posValToPix(new Point(pv.position,pv.value), this.domSize, this.positionRange,this.valueRange);
  }
  public posToPix(p: number) {
    return CurveUtils.posToPix(p, this.domSize.w, this.positionRange);
  }
  public valToPix(p: number) {
    return CurveUtils.valToPix(p, this.domSize.h, this.valueRange);
  }
  public findKeyFrameUnderMouse(e:MouseEvent){
    const positionValue = this.pixToPosVal(getPointFromEvent(e));
    const delta = this.pixToPosVal(
      new Point(this.pRadius, this.pRadius), false) ;

    let foundKeyFrame = this.curve.findClosestKeyForPositionValue(positionValue, delta);

    if (foundKeyFrame !== null && Math.abs(foundKeyFrame.value - positionValue.y) > delta.y * 2){
      foundKeyFrame = null;
    }
    return foundKeyFrame
  }

  public mouseDown(e: MouseEvent) {
    const mousePix = getPointFromEvent(e);
    dH.mouseDown(mousePix)
    this.hasDragged = false
    const positionValue = this.pixToPosVal(mousePix);
    let foundKeyFrame = this.findKeyFrameUnderMouse(e)
    if(this.hoveredKeyFrame!=null){
      this.curve.add(new KeyFrame<number>(positionValue.x,positionValue.y))
      this.hoveredKeyFrame = null
      foundKeyFrame = this.findKeyFrameUnderMouse(e)
    }
    else{
      if(secondaryEvent(e) ){
        if(foundKeyFrame===null){
          this.curve.add(new KeyFrame(positionValue.x,positionValue.y))
        }
        else{
          foundKeyFrame.easing = EasingFactory.createNextEasing(foundKeyFrame.easing)
        }
      }
    }


    this.mousePressedKeyFrame = foundKeyFrame;



  }


  public mouseUp(e: MouseEvent) {
    const mousePix = getPointFromEvent(e);
    dH.mouseUp(mousePix)
    const positionValue = this.pixToPosVal(mousePix);
    const foundKeyFrame = this.findKeyFrameUnderMouse(e)
    
    if(!this.hasDragged &&
      !secondaryEvent(e) &&
      this.selectedKeyFrame!==null &&
      foundKeyFrame===this.selectedKeyFrame &&
      this.curve.frames.length>2){

      this.curve.remove(this.selectedKeyFrame)
  }
  else{
    this.selectedKeyFrame =this.mousePressedKeyFrame
  }
  if (this.mousePressedKeyFrame === null) {
    this.curve.position = positionValue.x;
  }

  this.mousePressedKeyFrame = null;
}

public mouseMove(e: MouseEvent) {
  const mousePix = getPointFromEvent(e);
  dH.mouseMove(mousePix)
  this.hasDragged= this.hasDragged || (e.movementX!==0 || e.movementY!==0)
  
  const positionValue = this.pixToPosVal(mousePix);
  this.hoveredKeyFrameCircle = this.findKeyFrameUnderMouse(e)
  if (this.mousePressedKeyFrame !== null) {
    this.mousePressedKeyFrame.position = positionValue.x;
    this.mousePressedKeyFrame.value = positionValue.y;
  } else if (e.buttons === 0) {
    const vp = this.valToPix(this.curve.getValueAt(positionValue.x) as number);
    let newHoveredKeyFrame = null;
    const maxDist = 6
    if (Math.abs(mousePix.y - vp) < maxDist ) {
      const frames = this.curve.getKeyFramesForPosition(positionValue.x);
      if((frames.start && Math.abs(this.posToPix(frames.start.position)-mousePix.x)<maxDist)||
        (frames.end && Math.abs(this.posToPix(frames.end.position)-mousePix.x)<6)){
        //ignore when close to control points
    }
    else{
      this.hoveredPosValPix = new Point(mousePix.x,vp)
      newHoveredKeyFrame = frames.start || null;}
    }
    this.hoveredKeyFrame = newHoveredKeyFrame;
    // console.log(mousePix.x,positionValue.x,this.curve.getValueAt(positionValue.x))
  } else if (e.buttons === 1) {
    if (this.mousePressedKeyFrame === null) {
      this.curve.position = positionValue.x;
    }
  }
}





}
</script>


<style scoped>
</style>