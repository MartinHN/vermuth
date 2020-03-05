import {CurveBaseI, CurveStore, Curve} from './Curve';
import {ChannelBase} from './Channel';
import {GlobalTransport, TimeListener} from './Time';
import { SetAccessible, nonEnumerable, RemoteValue , RemoteFunction, AccessibleClass, isProxySymbol} from './ServerSync';
import {Ref, Refable, Factory, Proxyfiable, generateFromUIDList} from './MemoryUtils';
import rootState from './RootState';
import {uuidv4} from './Utils';


type CurveBaseType = CurveBaseI;

export class CurveLink extends Proxyfiable implements Refable {

  get curve() {return this.pcurve; }
  set curve(c: CurveBaseType) {
    if (this.pcurve) {this.pcurve.removeConsumer(this); }
    this.pcurve = c;
    if (this.pcurve) {this.pcurve.addConsumer(this); }
  }

  public get master() {
    return this.pmaster;
  }
  public set master(v: number) {
    this.pmaster = v;
    this.updateValue();
  }

  public set time(t: number) {
    if (this.doPause) {return; }
    this._curTime = (t - (this.startTime || 0) + (this.offset || 0));
    if (this._curTime === undefined || isNaN(this._curTime)) {
      debugger;
    }
    if (this._curTime < 0) {
      return;
    }
    if (this.doLoop ) {
      if (this.curve.span > 0) {
        this._curTime %= this.curve.span;
      } else {
        console.error('span is null');
        debugger;
      }
    } else {

    }
    this.updateValue();

  }


  public get time() {
    return this._curTime;
  }
  get value() {
    return this._curValue;
  }

  public static createFromObj(o: any) {
    if (!o || !o.pcurve || !o.channel) {
      console.error('conf error');
      debugger;
      return undefined;
    }
    const cu = (o.pcurve.uid ? o.pcurve : CurveStore.getForUID( o.pcurve ) )   as CurveBaseType;
    const ch = rootState.universe.getChannelFromUID(o.channel) as ChannelBase;
    if (!cu ) {
      console.error('curve not found');
      debugger;
      return undefined;
    }
    if (!ch ) {
      console.error('ch not found');
      debugger;
      return undefined;
    }
    const c = new CurveLink(cu, ch, o.uid);
    c.configureFromObj(o);
    return c;
  }
  public __references: Array<Ref<CurveLink>> = new Array<Ref<CurveLink>>(); // for refable
  @RemoteValue()
  public doLoop = true;
  @RemoteValue()
  public doPause = false;
  @RemoteValue()
  public offset = 0;

  public _curValue = 0;
  public uid: string;

  @nonEnumerable()
  public autoSetChannelValue = true; // used when merging curves in sequence player
  public __disposed = false;

  @RemoteValue()
  private startTime = 0;
  private pmaster = 1;

  private _curTime = 0;


  constructor(private pcurve: CurveBaseType, public channel: ChannelBase, uid: string) {

    super();

    if (!this.pcurve.addConsumer) {
      debugger;
    }
    if (!channel) {
      debugger;
    }

    this.pcurve.addConsumer(this);
    channel.externalController = this;
    if (!uid) {console.error('no uid given'); debugger; }
    this.uid = 'cl_' + channel.getUID() + '_' + (uid || uuidv4());
    if (CurvePlayer.hasCurveLinkWithUID(uid)) {console.error('double curvelink'); debugger; }
    CurveLinkStore.add(this);
  }

  public __onceProxyfied() {

  }



  public configureFromObj(o: any) {

    CurveLinkStore.remove(this, false);
    // this.pcurve = null
    for (const [k, v] of Object.entries(this)) {
      if (o[k] !== undefined) {
        if (k === 'pcurve') {
          const cu = CurveStore.getForUID(o[k]);
          if (cu) {
            this.curve = cu;
          } else {
            console.error('conf error');
            debugger;
          }
        } else if (k === 'channel') {
          const ch = rootState.universe.getChannelFromUID(o[k]);
          if (ch) {
            this.channel =  ch;
          } else {
            console.error('conf error');
            debugger;
          }
        } else {
          (this as any)[k] = o[k];
        }
      }
    }
    CurveLinkStore.add(this);
  }

  public toJSON() {
    const o: any = {uid: this.uid};
    for (const [k, v] of Object.entries(this)) {
      if (k.startsWith('_')) {continue; } else if (k === 'channel') {
        o[k] = this.channel.getUID();
      } else {
        o[k] = v;
      }
    }
    o.pcurve = this.pcurve.uid;
    return o;
  }

  public updateValue() {
    const nv = (this.curve.getValueAt(this._curTime) as number ) * this.pmaster;
    if (nv !== this._curValue) {
      this._curValue = nv;
      if (this.autoSetChannelValue) {
        this.channel.setValue(this._curValue, true);
      }
    }
  }
  public playAtTime(t: number) {
    this.startTime = t;
  }

  public playNow() {
    this.playAtTime(GlobalTransport.time);
  }


  public togglePlay() {
    this.doPause = !this.doPause;
    if (!this.doPause) {
      this.playNow();
    }
  }
  public __dispose() {
    if (this.__disposed) {
      console.error('double disposal');
      debugger;
    }
    this.__disposed = true;
    if (this.pcurve) {this.pcurve.removeConsumer(this); }
    this.channel.externalController = null;
  }

}


// @AccessibleClass()
// class CurveLinkStoreClass extends RefFactory<CurveLink>{


//   public get  allLinks(){ return this.factory}// {[uid: string]: CurveLink} = {};

//   public configureFromObj(o: any) {
//     for (const v of Object.values(this.allLinks)) {
//       this.remove(v);
//     }
//     super.configureFromObj(o)
//     if (o && o.allLinks) {
//       for (const [k, v] of Object.entries(o.allLinks)) {
//         const cl = CurveLink.createFromObj(v);
//         if (cl) {this.allLinks[(v as any).uid] = cl; } else {
//           console.error('conf error');
//           debugger;
//         }
//       }
//     }
//   }

//   public getForUID(uid: string) {
//     return this.allLinks[uid];
//   }
//   public add(cl: CurveLink) {
//     this.allLinks[cl.uid] = cl;

//   }
//   public remove(cl: CurveLink, doDispose= true) {
//     if (this.allLinks[cl.uid]) {
//       let df:any ;
//      if (!doDispose) {
//        df = cl.__dispose
//       cl.__dispose = ()=>{}; }
//      delete this.allLinks[cl.uid];
//      if(!doDispose){
//       cl.__dispose = df
//      }
//    }
//  }





// }


export const CurveLinkStore = new Factory<CurveLink>(CurveLink.createFromObj);


@AccessibleClass()
export class CurvePlayerClass extends TimeListener {
  static get i(): CurvePlayerClass {
    if (!CurvePlayerClass._instance) {CurvePlayerClass._instance = new CurvePlayerClass(); }
    return CurvePlayerClass._instance;
  }

  private static _instance: CurvePlayerClass|undefined;

  public curveLinkStore = CurveLinkStore;


  private readonly  curveLinkRefList = new Array< Ref<CurveLink> >();  // not accessible
  get curveLinkList() {return this.curveLinkRefList.map((e) => e.getPointed()); }

  private constructor() {
    super('CurvePlayer');
  }



  public configureFromObj(o: any) {
    for (const v of this.curveLinkList) {
      this.removeCurveLink(v);
    }
    this.curveLinkStore.configureFromObj(o.curveLinkStore);

    if (o && o.curveLinkRefList) {
      o.curveLinkRefList = [...new Set(o.curveLinkList)]; // avoid duplicates
      const cls = generateFromUIDList(o.curveLinkRefList, this.curveLinkStore);
      cls.map((e) => this.addCurveLink(e));
      // o.curveLinkRefList.map((uid: string) => {
      //   const cl = this.curveLinkStore.getForUID(uid);
      //   if (cl) {this.addCurveLink(cl); }
      // });
    }
  }

  // public toJSON() {
  //   return {
  //     curveLinkStore: this.curveLinkStore,
  //     curveLinkList: this.curveLinkList.map((e) => e.uid),
  //   };
  // }




  public timeChanged(t: number) {
    for (const c of this.curveLinkList) {
      c.time = t;
    }
  }


  public hasCurveLink(cl: CurveLink) {
    return this.curveLinkList.indexOf(cl) >= 0;
  }
  public hasCurveLinkWithUID(uid: string) {
    return this.curveLinkList.find((e) => e.uid === uid) !== undefined;
  }


  public getAssignedChannels() {
    const res = new Set<ChannelBase>();
    this.curveLinkList.map((e)  => res.add(e.channel));
    return res;
  }


  public getCurveLinkForChannel(ch: ChannelBase) {
    return this.curveLinkList.find((e) => e.channel === ch);
  }
  public getCurveForChannel(ch: ChannelBase) {
    const cl = this.getCurveLinkForChannel(ch);
    return cl ? cl.curve : undefined;
  }
  @RemoteFunction({sharedFunction: true})
  public removeChannel(ch: ChannelBase) {
    const cl = this.getCurveLinkForChannel(ch);
    if (cl) {
      this.removeCurveLink(cl);
      return true;
    } else {
      return false;
    }
  }

  @RemoteFunction({sharedFunction: true})
  public removeCurveLink(cl: CurveLink) {
    const i = this.curveLinkList.indexOf(cl);
    this.curveLinkRefList.splice(i, 1);
  }

  @RemoteFunction({sharedFunction: true})
  public addCurveLink(cl: CurveLink, doRestart =  true) {

    if (this.curveLinkList.indexOf(cl) < 0 || cl.autoSetChannelValue === false) {
      if (this.hasCurveLinkWithUID(cl.uid)) {
      console.error('adding existing');
      debugger;
    }
      this.curveLinkRefList.push(new Ref<CurveLink>(cl));
      if (!cl.playNow) {
        debugger;
      }
      if (doRestart) {cl.playNow(); }
    } else {
    console.error('re-add curve link');
  }
    return cl;
}

@RemoteFunction({sharedFunction: true})
public createCurveLink(c: CurveBaseType, ch: ChannelBase, uid: string) {
  if (this.removeChannel(ch)) {
    console.warn('reassingn channel curveLink');
  }
  return this.addCurveLink(new CurveLink(c, ch, uid));
}






}

export const CurvePlayer = CurvePlayerClass.i;
