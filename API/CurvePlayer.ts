import {CurveBase,CurveStore} from './Curve';
import {ChannelBase} from './Channel';
import {GlobalTransport, TimeListener} from './Time';
import { SetAccessible, RemoteValue , RemoteFunction, AccessibleClass} from './ServerSync';


class CurveLink {
  private listened = new Map<string, any>();
  constructor(public curve: CurveBase, public channel: ChannelBase, public offset = 0) {
    this.listened.set('value', this.vChanged.bind(this));
    for (const [k, v] of this.listened.entries()) {
      curve.on(k, v);
    }
    channel.externalController = this
  }
  public vChanged(v: number) {
    this.channel.setValue(v + this.offset, true);
  }
  public dispose() {
    for (const [k, v] of this.listened.entries()) {
      this.curve.off(k, v);
      this.channel.externalController = null
    }
  }
}


@AccessibleClass()
class CurvePlayerClass extends TimeListener {

  
  private curves :{[id:string]: Set<CurveLink>}={};// not accessible

  private _span = 1;

  constructor(
    _curves?: CurvePlayerClass["curves"],
    _span?: number) {
    super('CurvePlayer');
    if (_curves) {this.curves = _curves; }
    if (_span !== undefined) {this._span = _span; }
  }


  public timeChanged(t: number) {
    for (const c of this.curveList) {
      c.position = t;
    }
  }

  @RemoteFunction()
  public addCurve(c: CurveBase) {
    if (!this.getCurveForName(c.name)) {
      this.curves[c.name]= new Set<CurveLink>();
    } else {
      console.error('dupliucating curve');
    }
  }
  get curveNames(){
    return Array.from(Object.keys(this.curves))
  }

  get curveList(){
    return this.curveNames.map(n=>CurveStore.getCurveNamed(n)).filter(e=>e!==undefined) as Array<CurveBase>
  }
  get curveLinkList(){
    let res = new Array<CurveLink>()
     Object.values(this.curves).map(n=>res=  res.concat(Array.from(n)))
     return res
  }
  public hasCurve(c: CurveBase) {
    return this.curveList.indexOf(c) >= 0;
  }
  public getCurveForName(n: string) {
    return this.curveList.find((c) => c.name === n);
  }

  
  public getAssignedChannels() {
    const res = new Set<ChannelBase>();
    this.curveLinkList.map(e  => res.add(e.channel));
    return res;
  }


  public getCurveLinkForChannel(ch: ChannelBase) {
    for (const v of Object.values(this.curves)) {
      const cl = Array.from(v.values()).find((e: any) => e.channel === ch);
      if (cl) {return cl; }
    }
  }
  public getCurveForChannel(ch: ChannelBase) {
    const cl = this.getCurveLinkForChannel(ch);
    return cl ? cl.curve : undefined;
  }
  @RemoteFunction()
  public removeChannel(ch: ChannelBase) {
    const lastCurve = this.getCurveForChannel(ch);
    if (lastCurve) {
      const ns = this.curves[lastCurve.name] || new Set<CurveLink>();
      const cl = Array.from(ns.values()).find((e) => e.channel === ch);
      if (cl) {
        cl.dispose();
        ns.delete(cl);
      }
    } else {
      console.error('no curve to remove');
    }
  }
  @RemoteFunction()
  public assignChannelToCurveNamed(n: string, ch: ChannelBase, offset: number) {
    debugger
    const c = this.getCurveForName(n);
    if (c) {
      if (this.getCurveForChannel(ch)) {
        this.removeChannel(ch);
      }
      const chs = this.curves[n] || new Set<CurveLink>();

      this.curves[n]= chs.add(new CurveLink(c, ch, offset));
    }
  }




}

export const CurvePlayer = new CurvePlayerClass();
