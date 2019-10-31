import {Point, Size, Rect} from '@API/Utils2D';
import {Curve, KeyFrame} from '@API/Curve';
import {BezierEasing} from '@API/Easings/easings';

export class Range {
  constructor(public start: number, public end: number) {}
  public inRange(n: number) {return n >= this.start && n <= this.end; }
  get span() {return this.end - this.start; }
  clone(){return new Range(this.start,this.end)}
}




export function pixToPos(p: number, domWidth: number, positionRange: Range) {
  return p / domWidth * positionRange.span + positionRange.start;
}
export function pixToVal(p: number, domHeight: number, valueRange: Range, isAbsolutePoint= true) {
  let v = p / domHeight;
  if (isAbsolutePoint) {v = 1 - v; }
  return v * valueRange.span + valueRange.start;
}
export function posToPix(p: number, domWidth: number, positionRange: Range) {
  return (p - positionRange.start) / positionRange.span * domWidth;
}
export function valToPix(p: number, domHeight: number, valueRange: Range, isAbsolutePoint= true) {
  let v = (p - valueRange.start) / valueRange.span;
  if (isAbsolutePoint) {v = 1 - v; }
  return  v * domHeight;
}

export function pixToPosVal(p: Point, domSize: Size, positionRange: Range, valueRange: Range, isAbsolutePoint= true): Point {
  return new Point(pixToPos(p.x, domSize.w, positionRange),
    pixToVal(p.y, domSize.h, valueRange, isAbsolutePoint));
}
export function posValToPix(pv: Point, domSize: Size, positionRange: Range, valueRange: Range, isAbsolutePoint= true): Point {
  return new Point(posToPix(pv.x, domSize.w, positionRange),
    valToPix(pv.y, domSize.h, valueRange, isAbsolutePoint));
}

export function buildPathForFrames(frame: KeyFrame<number>, nextFrame: KeyFrame<number>, positionRange: Range, valueRange: Range, domSize: Size) {

  const framePixPos = posToPix(frame.position, domSize.w, positionRange);
  const framePixVal = valToPix(frame.value, domSize.h, valueRange);
  const nextFramePixPos = posToPix(nextFrame.position, domSize.w, positionRange);
  const nextFramePixVal = valToPix(nextFrame.value, domSize.h, valueRange);
  let r: string[] = ['M', '' + framePixPos, '' + framePixVal];
  if (frame.easing instanceof BezierEasing) {
    const p1 = frame.easing.getPA(framePixPos, framePixVal, nextFramePixPos, nextFramePixVal).map((e) => '' + e);
    const p2 = frame.easing.getPB(framePixPos, framePixVal, nextFramePixPos, nextFramePixVal).map((e) => '' + e);
    r = r.concat(['C', p1[0], p1[1], p2[0], p2[1]]);
  } else {
    r = r.concat(['L']);
    // r = r.concat(["L",""+posToPix(positionRange.end,domSize.w,positionRange),""+valToPix(v,domSize.h,valueRange)])
  }
  r = r.concat(['' + nextFramePixPos, '' + nextFramePixVal]);
  return r.join(' ');

}
export function buildCurvePath(curve: Curve<number>, positionRange: Range, valueRange: Range, domSize: Size): string {

  let r: string[] = [];
  let i = 0;
  let last: KeyFrame<number>|undefined;
  let cur: KeyFrame<number>|undefined;

  if (curve.frames.length <= 1) {return ''; }
  while (i < curve.frames.length) {
    last = cur;
    cur = curve.frames[i];
    if (cur.position > positionRange.start) {
      if (last !== undefined) {cur = last; }
      break;
    }
    i++;

  }
  if (cur === undefined) {debugger; return ''; }

  r = r.concat(['M', '' + posToPix(cur.position, domSize.w, positionRange), '' + valToPix(cur.value, domSize.h, valueRange)]);

  if (i >= curve.frames.length) {debugger; return r.join(' '); }
  const addPoint = (frame: KeyFrame<number>, lastFrame: KeyFrame<number>): void => {
    const pixPos = posToPix(frame.position, domSize.w, positionRange);
    const pixVal = valToPix(frame.value, domSize.h, valueRange);
    if (lastFrame.easing instanceof BezierEasing) {
      const lastPixPos = posToPix(lastFrame.position, domSize.w, positionRange);
      const lastPixVal = valToPix(lastFrame.value, domSize.h, valueRange);
      const p1 = lastFrame.easing.getPA(lastPixPos, lastPixVal, pixPos, pixVal).map((e) => '' + e);
      const p2 = lastFrame.easing.getPB(lastPixPos, lastPixVal, pixPos, pixVal).map((e) => '' + e);
      r = r.concat(['C', p1[0], p1[1], p2[0], p2[1]]);
    } else {
     r = r.concat(['L']);
     // r = r.concat(["L",""+posToPix(positionRange.end,domSize.w,positionRange),""+valToPix(v,domSize.h,valueRange)])
   }
    r = r.concat(['' + pixPos, '' + pixVal]);
 };
  while (i < curve.frames.length) {
  last = cur;
  cur = curve.frames[i];
  addPoint(cur, last);
  if (cur.position > positionRange.end) {break; }
  i++;
}

  return r.join(' ');
}



export function  getDisplayedKeyFramePairs(curve:Curve<number>,positionRange:Range): Array<[KeyFrame<number>, KeyFrame<number>]> {
    const res: Array<[KeyFrame<number>, KeyFrame<number>]> = [];
    for (let i = 0 ; i < curve.frames.length - 1 ; i++) {
      const first = curve.frames[i];
      const second = curve.frames[i + 1];
      if (positionRange.inRange(second.position) || positionRange.inRange(first.position)) {
        res.push([first, second]);
      }
      else if(first.position<positionRange.start && second.position>positionRange.end){
        if(res.length>0){console.error('weeeeiiird');}
        res.push([first, second]); // zoom between breakpoints
        break;
      }
    }
    return res;

}
// get drawnPath(){
  //     let r:string[] = []
  //     const {start,end} = this.curve.getKeyFramesForPosition(this.positionRange.start)
  //     if(start!==undefined && end !=undefined){
    //       const tPct = (this.positionRange.start-start.position)/(end.position-start.position)
    //       const v = start.easeWith(end.value,tPct) as number
    //       r = r.concat(["M",""+this.posToPix(this.positionRange.start),""+this.valToPix(v)])
    //     }
    //     let isFirst = r.length==0
    //     for(const v of this.displayedKeyFrames){
      //       r = r.concat([isFirst?"M":"L",""+this.posToPix(v.position),""+this.valToPix(v.value)])
      //       isFirst = false
      //     }
      //     const {start:start2,end:end2} = this.curve.getKeyFramesForPosition(this.positionRange.end)
      //     if(start2!==undefined && end2 !=undefined){
        //       const tPct = (this.positionRange.end-start2.position)/(end2.position-start2.position)
        //       const v = start2.easeWith(end2.value,tPct) as number
        //       r = r.concat(["L",""+this.posToPix(this.positionRange.end),""+this.valToPix(v)])
        //     }
        //     return r.join(" ")
        //   }

        //   get positionPath(){
          //     return ["M",this.posToPix(this.curve.position),0,"V",this.domSize.h].join(" ");
          //   }
          //   get curValuePath(){
            //     return ["M",0,this.valToPix(this.curve.value as number),"H",this.domSize.w].join(" ");
            //   }
