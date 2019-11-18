import {CurveBase} from './Curve'
import {ChannelBase} from './Channel'
import {GlobalTransport,TimeListener} from './Time'

class CurveLink{
  private listened = new Map<string,any>()
  constructor (public curve:CurveBase,public channel:ChannelBase,public offset = 0){
    this.listened.set("value",this.vChanged.bind(this))
    for(const [k,v] of this.listened.entries()){
      curve.on(k,v)
    }
  }
  vChanged(v:number){
    this.channel.setValue(v+this.offset,true)
  }
  dispose(){
    for(const [k,v] of this.listened.entries()){
      this.curve.off(k,v)
    }
  }

}

class _CurvePlayer extends TimeListener {

  constructor(
    public curves=new Map<CurveBase,Set<CurveLink>> (),
    private _span: number = 1) {
    super("CurvePlayer")
  }


  public timeChanged(t:number){
    for(const [c,chs] of this.curves.entries()){
      c.position = t
    }
  }
  addCurve(c:CurveBase){
    if(!this.getCurveForName(c.name)){
      this.curves.set(c,new Set<CurveLink>())
    }
    else{
      console.error('dupliucating curve')
    }
  }
  hasCurve(c:CurveBase){
    return Array.from(this.curves.keys()).indexOf(c)>=0
  }
  getCurveForName(n:string){
    return Array.from(this.curves.keys()).find((c)=>c.name===n)
  }

  get curveNames(){
    return Array.from(this.curves.keys()).map(e=>e.name)
  }
  getAssignedChannels(){
    const res = new Set<ChannelBase>()
    this.curves.forEach((v,k)=>{Array.from(v.values()).map(e=>res.add(e.channel))})
    return res
  }
  getCurveLinkForChannel(ch:ChannelBase){
    for(const [k,v] of this.curves.entries()){
      const cl = Array.from(v.values()).find((e:any)=>e.channel===ch)
      if(cl){return cl;}
    }
  }
  getCurveForChannel(ch:ChannelBase){
    const cl = this.getCurveLinkForChannel(ch)
    return cl?cl.curve:undefined
  }

  removeChannel(ch:ChannelBase){
    const lastCurve = this.getCurveForChannel(ch)
    if(lastCurve){
      const ns = this.curves.get(lastCurve) || new Set<CurveLink>()
      const cl = Array.from(ns.values()).find(e=>e.channel===ch);
      if(cl){
        cl.dispose();
        ns.delete(cl);
      }
    }
    else{
      console.error("no curve to remove")
    }
  }
  assignChannelToCurveNamed(n:string,ch:ChannelBase,offset:number){
    const c = this.getCurveForName(n)
    if(c){
      if(this.getCurveForChannel(ch)){
        this.removeChannel(ch)
      }
      const chs = this.curves.get(c) || new Set<CurveLink>()

      this.curves.set(c,chs.add(new CurveLink(c,ch,offset)))
    }
  }




}

export const CurvePlayer = new _CurvePlayer()
