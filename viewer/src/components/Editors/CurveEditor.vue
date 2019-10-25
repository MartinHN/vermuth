<template>


  <div class="main"  style="width:100%;height:100%">

    <Slider text="start" v-model=positionRange.start min=0 :max=curve.span-10></Slider>
    <Slider text="end" v-model=positionRange.end min=10 :max=curve.span+10></Slider>

    <svg ref=my-svg width=100% height=100% @mousedown="mouseDown" @mouseup="mouseUp" @mousemove="mouseMove" @mouseleave="mouseLeave" @mouseenter="mouseEnter">

      <circle  v-for="v in draggableKeyPoints" :key=v.id ref='framesCircles' :r="pRadius" :cx="v.location.x" :cy='v.location.y' :fill="v.hovered?'blue':v.selected?'red':'black'"></circle>

      <!-- <path :d=drawnPath stroke=black fill=transparent stroke-width=3></path> -->
      <path v-for="v in displayedKeyFramePairs" :key=v.id :d=buildSegment(v) stroke=black fill=transparent stroke-width=3></path>
      
      <circle :cx=newKeyFramePos.x :cy=newKeyFramePos.y fill=blue :r=pRadius></circle>

      <path :d=positionPath stroke=black fill=transparent stroke-width=1></path>

      <path :d=curValuePath stroke="black" stroke-dasharray="4,1" fill="transparent" stroke-width="1"></path>

<!--       <g v-if='selectedKeyFrame && selectedKeyFrame.easing.constructor.typeName=="bz"' fill=transparent stroke=blue>
-->
<template v-for="d in draggableHandles">
  <circle :cx=d.location.x :cy=d.location.y r=6 :fill="d.hovered?'blue':'transparent'"  stroke=blue></circle>

  <line :x1=posToPix(d.jsObj.relatedKf.position) :y1=valToPix(d.jsObj.relatedKf.value) :x2=d.location.x :y2=d.location.y stroke=blue></line>

</template>
<!-- </g> -->
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
import { Draggable,DraggableHandler } from '@/components/Utils/Draggable';

function getPointFromEvent(e: MouseEvent): Point {return new Point( e.offsetX,  e.offsetY); }

function secondaryEvent(e:MouseEvent){return e.metaKey}

class HandleJsType{
  constructor(public isB:boolean,public startKf:KeyFrame<number> ,public endKf:KeyFrame<number>){}
  get relatedKf(){return this.isB?this.endKf:this.startKf;}
}

class KeyFrameStartPointJsType{
  constructor(public kf:KeyFrame<number>){}
}

class KeyFramePathJsType{
  constructor(public kf:KeyFrame<number>){}
}
@Component({components: {Slider}})
export default class CurveEditor extends Vue {

  get domSize(): Size {
    const dom = this.svgDOM;
    const hasMountedDOM  = dom.clientWidth > 0;
    return new Size(hasMountedDOM ? dom.clientWidth : 10 , hasMountedDOM ? dom.clientHeight : 10);
  }

  public dH = new DraggableHandler()
  get displayedKeyFrames(): Array<KeyFrame<number>> {
    return this.curve.frames.filter((v) => this.positionRange.inRange(v.position));
  }

  get displayedKeyFramePairs(): Array<[KeyFrame<number>, KeyFrame<number>]> {
    return CurveUtils.getDisplayedKeyFramePairs(this.curve,this.positionRange);
  }
  
  public newKeyFramePos:Point = new Point(-100,-100);

  
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
  
  get selectedKeyFrame(){
    const k = this.dH.getSelectedObjAs(KeyFrameStartPointJsType)
    return k?k.kf:null
  }
  get nextSelectedKeyFrame(){
    const sel = this.selectedKeyFrame
    return sel?this.curve.getNextKeyFrame(sel):null
  }

  get draggableKeyPoints():Array<Draggable>{
    return this.displayedKeyFrames.map(
      (k:KeyFrame<number>):Draggable=>{
        const d =  new Draggable(
          new KeyFrameStartPointJsType(k)
          );
        d.isOver=(p:Point)=>{return d.location.dist(p)<2*this.pRadius}
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
  
  // private draggableHandles = new Array<Draggable>()
  // @Watch('dH.selectedDraggable',{deep:true})
  // cbDH(){
    get draggableHandles(){
    const selectedKT = this.dH.getSelectedObjAs(KeyFrameStartPointJsType)
    if(!selectedKT){ return;}

    const res = new Array<Draggable>()
    const selectedK = selectedKT.kf
    const nextK = this.curve.getNextKeyFrame(selectedK);
    const prevK = this.curve.getPrevKeyFrame(selectedK);
    const prevHasBezier = prevK && (prevK.easing instanceof BezierEasing)
    const curHasBezier = selectedK.easing instanceof BezierEasing
    if( curHasBezier ||prevHasBezier) {

      const getHandlePixPosition = (type:HandleJsType)=>{
        const curPix = this.posValToPix(type.startKf)
        const nextPix = this.posValToPix(type.endKf)
        const ease = (type.startKf).easing as BezierEasing;
        if(!ease.getPB){
          // debugger
          return new Point (0,0)
        }
        const PF =(type.isB?ease.getPB:ease.getPA).bind(ease) 
        const P = PF(curPix.x,curPix.y,nextPix.x,nextPix.y);
        // if(!type.isB){console.log('get',P)}
        return new Point(P[0],P[1])
      }
      const setHandlePosition=(p:Point,type:HandleJsType)=>{
        const curPix = this.posValToPix(type.startKf)
        const nextPix = this.posValToPix(type.endKf)
        const da:Point = p.csub(curPix).div(nextPix.csub(curPix));
        const ease = (type.startKf).easing as BezierEasing;
        const fun = (type.isB?ease.setBHandle:ease.setAHandle).bind(ease);
        // if(!type.isB){console.log('set',da)}
        da.x = Math.max(0,Math.min(1,da.x))
        da.y = Math.max(0,Math.min(1,da.y))
        fun(da.x,da.y)
      }
      if(prevHasBezier && prevK){
        const handleType = new HandleJsType(true,prevK,selectedK)
        const ld = new Draggable(handleType)
        ld.isSelectable = false
        ld.isOver =(p:Point)=>{return p.dist(ld.location)<this.pRadius}
        Object.defineProperty(ld,"location",{
          get:()=>getHandlePixPosition(handleType),
          set:(p:Point)=>{setHandlePosition(p,handleType)}
        })
        res.push(ld)
      }
      if(curHasBezier && nextK){
        const handleType = new HandleJsType(false,selectedK,nextK);
        const rd = new Draggable(handleType)
        rd.isSelectable = false
        rd.isOver =(p:Point)=>{return p.dist(rd.location)<this.pRadius}
        Object.defineProperty(rd,"location",{
          get:()=>getHandlePixPosition(handleType),
          set:(p:Point)=>{setHandlePosition(p,handleType)}
        })
        res.push(rd)
      }

    }
    // this.draggableHandles = res;
    return res;
  }



  get hoverableKeyFramePath(){
    return this.displayedKeyFramePairs.map((l:[KeyFrame<number>,KeyFrame<number>])=>{
      const d = new Draggable(new KeyFramePathJsType(l[0]))
      d.order = -1;
      d.isOver = (p:Point)=>{
        const v = this.curve.getValueAt(this.pixToPos(p.x)) as number
        return Math.abs(p.y-this.valToPix(v))<6
      }

      return d;

    })
    // 

  }
  get allDraggables(){
    let res  =new Array<Draggable>()
    res = res.concat(this.draggableKeyPoints)
    const dh= this.draggableHandles
    if(dh){res = res.concat(dh)}
      res = res.concat(this.hoverableKeyFramePath)
    return res;
  }




  public buildSegment(pair: [KeyFrame<number>, KeyFrame<number>]) {
    return CurveUtils.buildPathForFrames(pair[0], pair[1], this.positionRange, this.valueRange, this.domSize);
  }





  public mounted() {
    this.svgDOM =  this.$refs['my-svg'] as SVGGraphicsElement;
    this.dH.getAllDraggables = ()=>{return this.allDraggables}
    this.curve.add(new KeyFrame<number>(0, 0, new BezierEasing()));
    this.curve.add(new KeyFrame<number>(100, 0.5));
    this.curve.add(new KeyFrame<number>(200, 1));
    this.curve.autoDuration();
  }

  public pixToPosVal(p: Point, absolutePoint= true) {
    return CurveUtils.pixToPosVal(p, this.domSize, this.positionRange, this.valueRange, absolutePoint);
  }
  public posValToPix(pv:KeyFrame<number>, absolutePoint= true) {
    return CurveUtils.posValToPix(new Point(pv.position,pv.value), this.domSize, this.positionRange,this.valueRange);
  }
  public posToPix(p: number) {
    return CurveUtils.posToPix(p, this.domSize.w, this.positionRange);
  }
  public pixToPos(p: number) {
    return CurveUtils.pixToPos(p, this.domSize.w, this.positionRange);
  }

  public valToPix(p: number) {
    return CurveUtils.valToPix(p, this.domSize.h, this.valueRange);
  }


  public mouseDown(e: MouseEvent) {
    const mousePix = getPointFromEvent(e);
    if(secondaryEvent(e) ){

      const hoveredKT = this.dH.getHoveredObjAs(KeyFrameStartPointJsType)
      const hoveredK = hoveredKT?hoveredKT.kf:null 
      if(this.dH.hovered===null){
        const positionValue = this.pixToPosVal(mousePix)
        this.curve.add(new KeyFrame(positionValue.x,positionValue.y))
      }
      else if (hoveredK) {
        hoveredK.easing = EasingFactory.createNextEasing(hoveredK.easing)
      }
    }
    else if(this.dH.getHoveredObjAs(KeyFramePathJsType)){
      const newPoint = this.pixToPosVal(this.newKeyFramePos);
      this.curve.add(new KeyFrame<number>(newPoint.x,newPoint.y))

    }else if(e.buttons===1 && !this.dH.hovered){
      this.curve.position = this.pixToPos(mousePix.x)

    }


    this.$nextTick(()=>this.dH.mouseDown(mousePix,e))








  }


  public mouseUp(e: MouseEvent) {
    const mousePix = getPointFromEvent(e);
    const lastSelected = this.dH.getSelectedObjAs(KeyFrameStartPointJsType)

    this.dH.mouseUp(mousePix,e)
    if (lastSelected && 
      this.dH.hovered &&
      this.dH.hovered.jsObj === lastSelected &&
      !this.dH.hasDragged && 
      !secondaryEvent(e)
      ){
      this.curve.remove(lastSelected.kf);

  }

}

public mouseLeave(e:MouseEvent){
  this.dH.mouseLeave(e)
}
public mouseEnter(e:MouseEvent){
  this.dH.mouseEnter(e)
}
public mouseMove(e: MouseEvent) {
  const mousePix = getPointFromEvent(e);
  this.dH.mouseMove(mousePix,e)


  const kf = this.dH.getHoveredObjAs(KeyFramePathJsType)
  if(kf){
    const val = this.curve.getValueAt(this.pixToPos(mousePix.x)) as number
    const nPos = new Point(mousePix.x,this.valToPix(val))
    this.newKeyFramePos.x = nPos.x
    this.newKeyFramePos.y = nPos.y
  } 
  else if (this.newKeyFramePos.x!=-100){
    this.newKeyFramePos.x = -100
  }
  else if(e.buttons===1 && !this.dH.clicked){
    this.curve.position = this.pixToPos(mousePix.x)
  }


}





}
</script>


<style scoped>
</style>