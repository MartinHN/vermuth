import {Easing, EasingFactory, LinearEasing} from './Easings/easings';
import {Point} from './Utils2D';
import {EventEmitter } from 'events';
import {uuidv4} from "./Utils";
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
  private _parentCurve: any; // Curve<T> | undefined = undefined;
  get parentCurve() {
    return this._parentCurve as Curve<T>;
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




export interface CurveBaseI extends EventEmitter {
  name: string;
  uid:string;
  span: number;
  
  getValueAt(t:number): any;
  configureFromObj(o: any): void;
  toObj(): any;
  addConsumer(c:any):void;
  removeConsumer(c:any):void;
  hasConsumers():boolean;
  scaleToSpan(v:number):void;
  // goToPct(pct:number):void;
}

function notImplemented() {
  debugger;
  console.error('calling base curve');

}

let curveNum = 0;
export class Curve<T extends NumOrVec> extends EventEmitter implements CurveBaseI {
  constructor(
    public name: string,
    private _frames: Array<KeyFrame<T>> = new Array<KeyFrame<T>>(),
    uid?:string) {
    super();
    if (_frames.length === 0) {
      this.add(new KeyFrame<T>(0, 0 as T));
      this.add(new KeyFrame<T>(1000, 1 as T));
    }
    this.autoDuration();
    this.uid=uid||uuidv4()
    if(uid && CurveStore.hasUID(uid)){
      console.error("re adding existing uid")
      debugger;
    }
    CurveStore.add(this);
  }

  get frames() {return this._frames; }

  
  get length() {return this.frames.length; }
  
  public uid:string;
  public pspan: number = 1;

  scaleToSpan(v:number){
    if(v<=0){
      debugger
      console.error("can't set null span")
      v= 1
    }
    const ratio = v/this.pspan
    this.span = v
    this._frames.map(f=>f.position=f.position*ratio)
    
    
  }


  public set span(v:number){
    if(v<=0){
      debugger
      console.error("can't set null span")
      v = 1
    }
    
    this.pspan  = v
    
  }
  public get span(){
    return this.pspan
  }
  
  @nonEnumerable()
  public consumers = new Array<any>();
  
  addConsumer(c:any){
    if(this.consumers.indexOf(c)>=0){
      debugger
      console.error('consumer already registered')
      return
    }
    this.consumers.push(c)
  }
  removeConsumer(c:any){
    const i = this.consumers.indexOf(c)
    if(i<0){
      
      console.error('consumer not registered')
      return
    }
    this.consumers.splice(i,1)
  }
  hasConsumers(){
    return this.consumers.length>0
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
    this.span = o.span
    CurveStore.remove(this)
    this.uid = o.uid
    CurveStore.add(this);

  }
  public toObj(): any {

    return {
      name: this.name,
      uid:this.uid,
      span:this.span,
      _frames: this._frames.map((f) => f.toObj()),
    };
  }
  
  public autoDuration() {
    if (this.frames.length > 1) {
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
    this.autoDuration();
    return this;
  }
  public clear() {
    this.frames.splice(0, this.frames.length);
  }
  public childTvChanged(child: KeyFrame<T>) {
    if (child.position > this.span) {
      this.span = child.position;
    }
    

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

type CurveBaseType = CurveBaseI
@AccessibleClass()
export class CurveStoreClass  {
  private static _instance :CurveStoreClass|undefined
  private constructor(){}
  static get i():CurveStoreClass{ 
    if(!CurveStoreClass._instance){CurveStoreClass._instance=new CurveStoreClass();}
    return CurveStoreClass._instance;
  }

  @SetAccessible({readonly: true})
  private curves :{[id:string]:CurveBaseType} = {};

  public configureFromObj(o: any) {
    while (this.curveList.length) {this.remove(this.curveList[0]); }
    if (o && Array.isArray(o)) {
      for (const c of o) {
        const cu = new Curve<number>('new');
        cu.configureFromObj(c);//add to the store
        //if (!this.curves.some((ccu) => cu.name === ccu.name)) {this.curves.push(cu); }
      }
    }
   }
  public toJSON() {
    const res = new Array<CurveBaseType>();
    this.removeUnused();
    for (const c of Object.values(this.curveList)) {
      res.push(c.toObj());
      
    }
    return res;
  }

  public removeUnused(){
    this.curveList.splice(0, this.curveList.length,...this.curveList.filter(c=>c.hasConsumers()));
  }
  
  @RemoteFunction()
  public addNewCurve(name:string,uid:string){
    const cu = new Curve<number>(name,new Array<KeyFrame<number>>(),uid);
    this.add(cu);
    return cu
  }

  public add(c: CurveBaseType) {
    const oldC = this.curves[c.uid]
    if(oldC){this.remove(oldC);}
    if(c.uid){
      this.curves[c.uid]=c;
      return c
    }
    
    console.error("no uid on curve")
    return undefined
  }
  public hasUID(u:string){return Object.keys(this.curves).includes(u)}

  public remove(c:CurveBaseType){
    if(this.curves[c.uid]){
      delete this.curves[c.uid]
    }
  }
  public get curveList(){
    return Object.values(this.curves)
  }
  public getCurveWithUID(uid:string){
    return this.curves[uid]
  }
  public getCurveNamed(name: string): CurveBaseType | undefined {
    return this.curveList.find((e: CurveBaseType) => e.name === name);
  }
}

export const CurveStore = CurveStoreClass.i;

