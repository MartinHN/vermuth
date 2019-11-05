import {Easing, LinearEasing} from './Easings/easings';
import {Point} from './Utils2D';

export interface Vector {
  x: number;
  y: number;
  // z?:number
}

export type NumOrVec  = Vector | number;

export function isVector(v: NumOrVec): v is Vector {
  return (v as Vector).x !== undefined;
}

export function isNumber(v: NumOrVec): v is number {
  return typeof(v) === 'number';
}



export class KeyTarget {
  constructor(public target: NumOrVec) {
  }
  get value() {return this.target; }
  // set value(v:T){ this.target = v}
  public setFrom(v: NumOrVec) {
    if (isVector(this.target) && isVector(v)) {this.target.x = v.x; this.target.y = v.y; } else if (isNumber(this.target) && isNumber(v)  ) {this.target = v; } else {console.error('trying to assign NumOrVec KeyFrame'); }

  }

}



// export function EasingWraper(a:number,b:number,pct:number,fun:EasingFunction):number;
// export function EasingWraper(a:Vector,b:Vector,pct:number,fun:EasingFunction):Vector;
export function EasingWraper(a: NumOrVec, b: NumOrVec, pct: number, ease: Easing): NumOrVec {
  if (typeof(a) === 'number' && typeof(b) === 'number') {
    return ease.compute(a, b, pct);
  } else if (isVector(a) && isVector(b)) {
    return {x: ease.compute(a.x, b.x, pct), y: ease.compute(a.x, b.x, pct)};
  } else { return 0; }
}


export class KeyFrame<T extends NumOrVec > {
  private parentCurve: Curve<T> | undefined = undefined;
  constructor(private _position: number, private _value: T, public _easing: Easing = new LinearEasing()) {

  }

  get easing() {return this._easing; }
  set easing(e: Easing) {
    this._easing = e;
    if (this.parentCurve) {this.parentCurve.childTvChanged(this); }
  }

  get position(): number {return this._position; }
  set position(t: number) {

    let maxP = this.parentCurve ? this.parentCurve.span : +Infinity;
    let minP = 0;
    if (this.parentCurve && this.parentCurve.frames.length >= 2) {
      const curI = this.parentCurve.frames.indexOf(this);
      if (curI >= 0) {
        if (curI < this.parentCurve.frames.length - 1) {
          maxP = this.parentCurve.frames[curI + 1].position;
        }
        if (curI > 0) {
          minP = this.parentCurve.frames[curI - 1].position;
        }
      }
    }
    t = Math.max(Math.min(t, maxP), minP);
    const ch = t !== this._position;
    this._position = t;
    if (ch) {
      if (this.parentCurve) {this.parentCurve.childTvChanged(this); }
    }
  }

  get value(): T {return this._value; }
  set value(v: T) {
    const ch = v !== this._value;
    this._value = v;
    if (ch) {
      if (this.parentCurve) {
        this.parentCurve.childTvChanged(this);
      }
    }
  }

  public setParentCurve(parent: Curve<T>|undefined) {
    this.parentCurve = parent;
  }

  public easeWith(b: T, pct: number): NumOrVec {
    return EasingWraper(this.value, b, pct, this.easing);
  }


}




interface CurveBase {
  position: number;
  span: number;
  // goToPct(pct:number):void;
}

export class Curve<T extends NumOrVec> implements CurveBase {
  private _span: number = 0;
  private _position: number = 0;
  private _value: NumOrVec = 0;
  constructor(
    private _frames: Array<KeyFrame<T>> = new Array<KeyFrame<T>>(),
    private _targets: KeyTarget[]= new Array<KeyTarget>()) {

  }

  get frames() {return this._frames; }
  get targets() {return this._targets; }
  set span(n: number) {
    this._span = n;
    this.updateValue();
  }
  get span() {return this._span; }



  set position(p: number) {
    if (this._position !== p) {
      this._position = p;
      this.updateValue();
    }
  }
  get position() {return this._position; }

  get value() {return this._value; }

  public autoDuration() {
    if (this.frames.length > 0) {
      const last = this.frames[this.frames.length - 1];
      this.span = last.position;
    }
  }
  public getNextKeyFrame(k: KeyFrame<T>): KeyFrame<T>|undefined {
    const i = this._frames.indexOf(k);
    if (i >= 0 && i < this.frames.length - 1) {
      return this._frames[i + 1];
    }
  }

  public getPrevKeyFrame(k: KeyFrame<T>): KeyFrame<T>|undefined {
    const i = this._frames.indexOf(k);
    if (i > 0 && i <= this.frames.length - 1) {
      return this._frames[i - 1];
    }
  }
  public updateValue() {
    if (this._span > 0) {
      const v = this.getValueAt(this._position);
      this._value =  v;
      for (const t of this.targets) {
        t.setFrom(v);
      }
    } else {console.error('no span'); }
  }

  public getValueAt(position: number): NumOrVec {
    const fr = this.getKeyFramesForPosition(position);
    let v: NumOrVec|undefined = fr.start ? fr.start.value : fr.end ? fr.end.value : undefined;
    if (v !== undefined  ) {
      if (fr.start && fr.end) {
        const pctDone = (position - fr.start.position) / (fr.end.position - fr.start.position);
        v = fr.start.easeWith(fr.end.value, pctDone);
      }
    } else {
      console.error('getValueAt error');
      v = 0;
    }
    return v;
  }
  public add(c: KeyFrame<T>) {
    this.frames.push(c);
    this.frames.sort((a, b) => a.position - b.position);
    c.setParentCurve(this);
    return this;
  }
  public remove(c: KeyFrame<T>) {
    const i = this.frames.indexOf(c);
    if (i >= 0) {this.frames.splice(i, 1); }
    c.setParentCurve(undefined);
    return this;
  }
  public childTvChanged(child: KeyFrame<T>) {
    if (child.position > this.span) {
      this.span = child.position;
    }
    this.updateValue();

  }

  public [Symbol.iterator]() { return this.frames.values(); }

  public findClosestKeyForPosition(position: number, maxDeltaPosition: number = -1) {

    if (this.frames.length === 0) {return null; }
    let res = this.frames[0];

    for (const v of this.frames) {
      if (Math.abs(v.position - position) < Math.abs(res.position - position)) {
        res = v;
      }
    }
    if (maxDeltaPosition < 0 || Math.abs(res.position - position) <= maxDeltaPosition) {
      return res;
    } else {
      return null;
    }
  }

  public findClosestKeyForPositionValue(pv: Point, maxDelta: Point = new Point(-1, 0)) {

    if (this.frames.length === 0) {return null; }
    let res = this.frames[0];
    let distSq = pv.distSq(new Point (res.position, (res.value as number)));
    for (const v of this.frames) {
      const curD = pv.distSq(new Point (v.position, (v.value as number)));
      if (curD < distSq) {
        distSq = curD;
        res = v;
      }
    }
    if (maxDelta.x < 0 ||
      (Math.abs(res.position - pv.x) <= maxDelta.x) &&
      (Math.abs((res.value as number) - pv.y) <= maxDelta.y)
      ) {
      return res;
  } else {
    return null;
  }
}
get length() {return this.frames.length; }
public addTarget(t: KeyTarget) {
  const i = this.targets.indexOf(t);
  if (i >= 0) {this.targets.splice(i); }
}

public getKeyFramesForPosition(position: number): {start: KeyFrame<T>|undefined, end: KeyFrame<T>|undefined} {
  for ( let i = 0; i <  this.frames.length - 1 ; i++) {
    const start = this.frames[i];
    const end = this.frames[i + 1];
    if (position >= start.position &&  position < end.position) {
      return {start, end};
    }
  }
  if (this.frames.length > 0) {
    const end = this.frames[this.frames.length - 1];
    if (position >= end.position) {
      return  {start: end, end: undefined};
    } else {
      return  {start: undefined, end: this.frames[0]};
    }
  }
  console.error('empty keyframe list');
  return {start: undefined, end: undefined};
}


}



export class CurvePlayer {

  constructor(
    public curves: CurveBase[] = new Array<CurveBase> (),
    private _span: number = 1) {}

}

