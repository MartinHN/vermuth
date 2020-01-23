import {CurveBase, CurveStore, Curve} from './Curve';
import {ChannelBase} from './Channel';
import {GlobalTransport, TimeListener} from './Time';
import { SetAccessible,nonEnumerable, RemoteValue , RemoteFunction, AccessibleClass} from './ServerSync';
import rootState from "@API/RootState"
import {uuidv4} from "@API/Utils";

export class CurveLink {

  private startTime = 0;
  public doLoop = true;
  public doPause = false;
  private pmaster = 1;
  public offset = 0;
  
  private _curTime = 0;
  
  public _curValue = 0;
  public uid:string;

  constructor(private pcurve: CurveBase, public channel: ChannelBase) {
    if(!this.pcurve.addConsumer){
      debugger
    }
    this.pcurve.addConsumer(this)
    channel.externalController = this;
    this.uid = 'cl_'+channel.getUID()+'_'+uuidv4();
    CurveLinkStore.add(this)
  }
  
  get curve(){return this.pcurve;}
  set curve(c:CurveBase){
    if(this.pcurve)this.pcurve.removeConsumer(this); 
    this.pcurve = c;
    if(this.pcurve)this.pcurve.addConsumer(this); 
  }

  static createFromObj(o:any){
    if(!o || !o.pcurve || !o.channel){
      console.error('conf error')
      debugger
      return undefined
    }
    const cu = (o.pcurve.uid?o.pcurve:CurveStore.getCurveWithUID( o.pcurve ) )   as CurveBase
    const ch = rootState.universe.getChannelFromUID(o.channel) as ChannelBase
    if(!cu ){
      console.error("curve not found");
      debugger;
    }
    if(!ch ){
      console.error("ch not found");
      debugger;
    }
    const c = new CurveLink(cu,ch)
    c.configureFromObj(o)
    return c
  }
  public configureFromObj(o:any){
    CurveLinkStore.remove(this)
    for(const [k,v] of Object.entries(this)){
      if(o[k]!==undefined){
        if(k==="pcurve"){
          const cu = CurveStore.getCurveWithUID(o[k])
          if(cu){
            this.curve = cu
          }
          else{
            console.error('conf error')
            debugger
          }
        }
        else if(k=="channel"){
          const ch = rootState.universe.getChannelFromUID(o[k])
          if(ch){

            this.channel =  ch
          }
          else{
            console.error('conf error')
            debugger
          }
        }
        else{
          (this as any)[k] = o[k]
        }
      }
    }
    CurveLinkStore.add(this)
  }

  public toJSON(){
    const o:any = {}
    for(const [k,v] of Object.entries(this)){
      if(k.startsWith('_')){continue;}
      else if(k=="channel"){
        o[k] = this.channel.getUID()
      }
      else{
        o[k] = v
      }

    }

    o["pcurve"] = this.pcurve.uid

    return o
  }

  public get master(){
    return this.pmaster
  }
  public set master(v:number){
    this.pmaster = v
    this.updateValue();
  }

  public set time(t:number){
    if(this.doPause){return}
      this._curTime = (t-(this.startTime||0) + (this.offset || 0))
    if(this._curTime===undefined || isNaN(this._curTime)){
      debugger
    }
    if(this._curTime<0){
      return
    }
    if(this.doLoop ){
      if(this.curve.span>0){
        this._curTime%=this.curve.span
      }
      else{
        console.error("span is null")
        debugger
      }
    }
    else{

    }
    this.updateValue()

  }

  public updateValue() {
    const nv = (this.curve.getValueAt(this._curTime) as number )*this.pmaster;
    if(nv!==this._curValue){
      this._curValue=nv;
      this.channel.setValue(this._curValue,true)
    }
  }


  public get time(){
    return this._curTime
  }

  public playAtTime(t:number){
    this.startTime = t
  }

  public playNow(){
    this.playAtTime(GlobalTransport.time)
  }
  public togglePlay(){
    this.doPause = !this.doPause
    if(!this.doPause){
      this.playNow()
    }
  }
  public dispose() {
    if(this.pcurve)this.pcurve.removeConsumer(this)
      this.channel.externalController = null;
  }

}

@AccessibleClass()
class CurveLinkStoreClass{
  public allLinks : {[uid:string]:CurveLink} = {}

  configureFromObj(o:any){
    this.allLinks = {}
    if(o && o.allLinks){

      for(const [k,v] of Object.entries(o.allLinks)){
        const cl = CurveLink.createFromObj(v)
        if(cl)
          {this.allLinks[(v as any)['uid']] = cl}
        else{
          console.error('conf error')
          debugger
        }
      }
    }
  }

  getForUID(uid:string){
    return this.allLinks[uid]
  }
  add(cl:CurveLink){
    this.allLinks[cl.uid] = cl

  }
  remove(cl:CurveLink){
    if(this.allLinks[cl.uid]){
      cl.dispose()
      delete this.allLinks[cl.uid]
    }
  }



};


export const CurveLinkStore = new CurveLinkStoreClass()

@AccessibleClass()
class CurvePlayerClass extends TimeListener {

  public curveLinkStore = CurveLinkStore



  public configureFromObj(o:any){
    this.curveLinkStore.configureFromObj(o.curveLinkStore)
    this.curveLinkList = new Array<CurveLink>() 
    if(o.curveLinkList){o.curveLinkList.map((uid:string)=>this.addCurveLink(this.curveLinkStore.getForUID(uid)))}
  }

public toJSON(){
  return {
    curveLinkStore:this.curveLinkStore,
    curveLinkList:this.curveLinkList.map(e=>e.uid)
  }
}

@nonEnumerable()
private curveLinkList= new Array<CurveLink>()  // not accessible

constructor() {
  super('CurvePlayer');
}


public timeChanged(t: number) {
  for (const c of this.curveLinkList) {
    c.time = t
  }
}


public hasCurveLink(cl: CurveLink) {
  return this.curveLinkList.indexOf(cl) >= 0;
}



public getAssignedChannels() {
  const res = new Set<ChannelBase>();
  this.curveLinkList.map((e)  => res.add(e.channel));
  return res;
}


public getCurveLinkForChannel(ch: ChannelBase) {
  return this.curveLinkList.find(e=>{return e.channel===ch})
}
public getCurveForChannel(ch: ChannelBase) {
  const cl = this.getCurveLinkForChannel(ch);
  return cl ? cl.curve : undefined;
}
@RemoteFunction()
public removeChannel(ch: ChannelBase) {
  const cl = this.getCurveLinkForChannel(ch);
  if (cl) {
    this.removeCurveLink(cl)
    return true
  } else {
    return false
  }
}

public removeCurveLink(cl:CurveLink){
  const i = this.curveLinkList.indexOf(cl)
  this.curveLinkList.splice(i,1)
}

public addCurveLink(cl:CurveLink){
  if(this.curveLinkList.indexOf(cl)<0){
    this.curveLinkList.push(cl);
  }
  else{
    console.error('re-add curve link')
  }
  return cl
}

// @RemoteFunction()
public createCurveLink(c:CurveBase, ch: ChannelBase) {
  if(this.removeChannel(ch)){
    console.warn('reassingn channel curveLink')
  }
  return this.addCurveLink(new CurveLink(c, ch))
}






}

export const CurvePlayer = new CurvePlayerClass();
