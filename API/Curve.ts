import {Easing, EasingFactory, LinearEasing} from './Easings/easings';
import {Point} from './Utils2D';
import {EventEmitter } from 'events';

import {nonEnumerable, RemoteValue , AccessibleClass, SetAccessible, RemoteFunction} from './ServerSync';


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
  @nonEnumerable()
  private _parentCurve: any;//Curve<T> | undefined = undefined;
  get parentCurve(){
    return this._parentCurve as Curve<T>
  }
  constructor(private _position: number, private _value: T, public _easing: Easing = new LinearEasing()) {

  }
  public configureFromObj(o: any) {
    this.position = o._position;
    this.value = o._value;
    this.easing = EasingFactory.createFromObj(o._easing) || new LinearEasing();
  }
  public toObj() {
    return {_position: this._position, _value: this._value, _easing: this._easing.toObj()};
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
    this._parentCurve = parent;
  }

  public easeWith(b: T, pct: number): NumOrVec {
    return EasingWraper(this.value, b, pct, this.easing);
  }


}




interface CurveBaseI extends EventEmitter {
  name: string;
  position: number;
  span: number;
  getValue(): any;
  configureFromObj(o: any): void;
  toObj(): any;

  // goToPct(pct:number):void;
}

function notImplemented(){
  debugger
  console.error('calling base curve')
  
}
export class CurveBase extends EventEmitter implements CurveBaseI{
  name="not impl";
  position=-1;
  span = -1;
  constructor(){super();notImplemented();}
  getValue(){notImplemented();};
  configureFromObj(o: any){notImplemented();}
  toObj(){notImplemented();}
}

let curveNum = 0;
export class Curve<T extends NumOrVec> extends EventEmitter implements CurveBaseI {
  get frames() {return this._frames; }

  set span(n: number) {
    this._span = n;
    this.updateValue();
  }
  get span() {return this._span; }



  set position(p: number) {
    const np = this.isLooping ? p % this.span : p;
    if (this._position !== np) {
      this._position = np;
      this.updateValue();
    }
  }
  get position() {return this._position; }

  get value() {return this._value; }
  get length() {return this.frames.length; }
  public isLooping = true;
  public uid = curveNum++;
  private _span: number = 0;
  private _position: number = 0;
  private _value: NumOrVec = 0;
  constructor(
    public name: string,
    private _frames: Array<KeyFrame<T>> = new Array<KeyFrame<T>>()) {
    super();
    if (_frames.length === 0) {
      this.add(new KeyFrame<T>(0, 0 as T));
      this.add(new KeyFrame<T>(1000, 1 as T));
    }
    this.autoDuration();
    CurveStore.add(this);
  }
  public configureFromObj(o: any) {
    this.clear();
    this.name = o.name;
    this._frames = [];
    o._frames.map((f: any) => {
      const k = new KeyFrame<T>(0, 0 as T);
      k.configureFromObj(f);
      this.add(k);
    });

  }
  public toObj(): any {
    return {
      name: this.name,
      _frames: this._frames.map((f) => f.toObj()),
    };
  }
  public getValue() {return this._value; }
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
      const hasChange = this._value !==  v;
      this._value =  v;
      if (hasChange) {this.emit('value', v); }

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
  public clear() {
    this.frames.splice(0, this.frames.length);
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

@AccessibleClass()
class CurveStoreClass  {

  @SetAccessible({readonly: true})
  private curves = new Array<CurveBaseI>();

  public configureFromObj(o: any) {
    while(this.curves.length){this.curves.pop()};
    if (o && Array.isArray(o)) {
      for (const c of o) {
        const cu = new Curve<number>('new');
        cu.configureFromObj(c);
        if(!this.curves.some(c=>cu.name===c.name))
          {this.curves.push(cu);}
      }
    }
   }
  public toJSON() {
    const res = new Array<CurveBaseI>();
    for (const c of Object.values(this.curves)) {
      res.push(c.toObj());
    }
    return res;
  }

  public add(c: CurveBase) {
    return this.curves.push(c);
  }


  public getCurveNamed(name: string): CurveBase | undefined {
    return this.curves.find((e: CurveBase) => e.name === name);
  }
}

export const CurveStore = new CurveStoreClass();

