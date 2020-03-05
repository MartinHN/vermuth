import { State, StateList, blackState, ResolvedFixtureState, MergedState } from './State';
import { DirectFixture } from './Fixture';
import { ChannelBase } from './Channel';
import {  doTimer, stopTimer } from './Time';
import { RemoteFunction, doSharedFunction, RemoteValue, nonEnumerable, AccessibleClass, SetAccessible } from './ServerSync';



export class Sequence {


  public static createFromObj(o: any): any {

    const seq = new Sequence(o.name || 'no name', o.stateName);
    seq.configureFromObj(o);
    return seq;
    // o.pChannelValues.map( (oo: any) => res.pChannelValues.push(new ChannelWithValue(oo.channelName, oo.value)) );
    // return res;
  }

  public timeIn: number = 0;
  public hold: number = 0;
  public timeOut: number = 0;
  public stateName: string = 'none';


  @nonEnumerable()
  public __state?: State;

  constructor(public name: string, state: string|State) {
    // debugger
    if (typeof state === 'string') {
      this.stateName = state;
    } else if (state) {
      this.stateName = state.name;
      this.__state = state;
    } else {
      debugger;
    }
  }

  public configureFromObj(o: any) {
    for (const key in this) {
      if (o[key] !== undefined) {
        this[key] = o[key];
      }
    }


  }


  public resolveState(stateResolver: (n: string) => State|undefined) {
    if (this.__state &&  this.stateName && this.__state.name === this.stateName) {
      return this.__state;
    }
    const rs = stateResolver(this.stateName);
    if (rs) {
      this.__state = rs;
    }
    return rs;

  }



}

const blackSeq = new Sequence('black', blackState);

@AccessibleClass()
export class SequenceList {

  @SetAccessible({readonly: true})
  private list = new Array<Sequence>();

  constructor() {
  }
  public configureFromObj(ob: any) {
    this.clearSequences();
    (ob.list || []).map((e: any) => this.list.push(Sequence.createFromObj(e)));
  }

  public get listGetter() {
    return this.list;
  }

  public insertAt(s: Sequence, i: number) {
    if (i >= 0 || i <= this.list.length) {
      const ii = this.list.findIndex((ss) => ss.name === s.name);
      if (ii !== -1) {
        s.name = s.name + '.';
      }
      if (i === this.list.length) {
        this.list.push(s);
      } else {
        this.list.splice (i, 0, s);
      }
    } else {
      console.error('invalid index', i);
    }
  }
  public getAtIdx(i: number) {
    return this.list[i];
  }
  public indexOf(s: Sequence) {
    return this.list.indexOf(s);
  }
  public appendSequence(s: Sequence) {
    this.insertAt(s, this.list.length);
  }
  public remove(s: Sequence) {
    const i = this.list.indexOf(s);
    if (i >= 0) {
      this.list.splice (i, 1);
    }
  }

  public setSeqIdx(s: Sequence, i: number) {
    const ii = this.list.indexOf(s);
    if (ii >= 0) {
      this.remove(s);
      i = Math.min(this.list.length - 1, Math.max(0, i));
      this.insertAt(s, i);
    }
  }

  public swap(a: Sequence, b: Sequence) {
    const ia = this.list.indexOf(a);
    const ib = this.list.indexOf(b);
    this.list[ia] = this.list.splice(ib, 1, this.list[ia])[0];
  }

  public up(s: Sequence) {
    const prev = this.list.indexOf(s) - 1;
    if (prev >= 0) {this.swap(s, this.list[prev]); }
  }
  public down(s: Sequence) {
    const next = this.list.indexOf(s) + 1;
    if (next < this.list.length) {this.swap(s, this.list[next]); }
  }
  public find(f: (s: Sequence) => boolean) {
    return this.list.find(f);
  }

  public clearSequences() {
    this.list.splice(0, this.list.length);
  }
  get length() {
    return this.list.length;
  }

}

interface RootProvider {
  stateList: StateList;
  sequenceList: SequenceList;
}


@AccessibleClass()
export class SequencePlayerClass {
  static get i(): SequencePlayerClass {
    if (!SequencePlayerClass._instance) {
      SequencePlayerClass._instance = new SequencePlayerClass();
    }
    return SequencePlayerClass._instance;
  }

  get stateList() {
    if (this._rootProvider === undefined) {console.error('stateListNotInited'); debugger; }
    return this._rootProvider ? this._rootProvider.stateList : {states: {} as {[key: string]: State}, getCurrentFullFixtureList: () => []};
  }
  get sequenceList() {
    if (this._rootProvider === undefined) {console.error('stateListNotInited'); debugger; }
    return this._rootProvider ? this._rootProvider.sequenceList : new SequenceList();
  }

  public get isPlaying() {
    return this.pisPlaying;
  }


  public get curPlayedIdx() {
    return this.pcurPlayedIdx;
  }
  public set curPlayedIdx(v: number) {
    if (v >= 0 && v < this.sequenceList.length) {
      this.goToSequence(this.sequenceList.getAtIdx(v));
    }
  }
  private static _instance: SequencePlayerClass|undefined;



  public curSeq: Sequence = blackSeq;
  public nextSeq: Sequence = blackSeq;

  public pctDone = 0;

  @RemoteValue()
  public playState: string = 'stopped';
  @RemoteValue()
  private pcurPlayedIdx = -1;

  @RemoteValue()
  private pisPlaying = false;

  @nonEnumerable()
  private _rootProvider?: RootProvider = undefined;

  private constructor() {}

  @RemoteFunction({sharedFunction: true})
  public goToStateNamed(name: string, timeIn: number, opts?: {dimMaster?: number}, cb?: () => void): void {
    const seq = new Sequence('tmp', '' + name);
    if (! timeIn) {
      timeIn = 0;
    }
    seq.timeIn = timeIn;
    this.goToSequence(seq, opts, cb);
  }

  @RemoteFunction({sharedFunction: true})
  public goToSequenceNamed(name: string, opts?: {dimMaster?: number}, cb?: () => void): void {
    name = '' + name;
    const tSeq = this.sequenceList.find((s) => s.name === name);
    if (!tSeq) {
      console.error('seq not found');
      return;
    }
    this.goToSequence(tSeq, opts, cb);

  }

  @RemoteFunction({skipClientApply: true})
  public stopIfPlaying() {
    stopTimer('seqTransition');
  }

  public linkToRoot(rootProvider: RootProvider) {
    if (this._rootProvider !== undefined) {
      console.error('double init of sequencePlayer');
      debugger;
    }
    if (rootProvider === undefined ) {
     console.error('setting empty root');
     debugger;
   }
    this._rootProvider = rootProvider;
 }

 @RemoteFunction({sharedFunction: true})
 private goToSequence(seq: Sequence, opts?: {dimMaster?: number}, cb?: any) {
  this.nextSeq = seq;
  const stateResolver = (n: string) => {
    return this.stateList.states[n];
  };

  const nIdx = this.sequenceList.indexOf(seq);
  if (nIdx >= 0) {
    this.pcurPlayedIdx = nIdx;
    this.pisPlaying = true;
  }

  // const timeOut =  this.curSeq.timeOut*1000;
  const timeIn =  this.nextSeq.timeIn ;
  const nextState = this.nextSeq.resolveState(stateResolver);
  if (nextState) {
   const dimMaster = opts ? opts.dimMaster !== undefined ? opts.dimMaster : 1 : 1;
   this.goToStates([nextState], this.nextSeq.timeIn, {dimMasters: [dimMaster]},
    (...args: any[]) => {
      doSharedFunction(() => {
        this.pisPlaying = false;
        if (cb) {cb(...args); }
      });
    });
 }
}

@RemoteFunction({sharedFunction: true})
private goToStates(nextStates: State[], timeIn: number, opts?: {dimMasters?: number[]}, cb?: any) {
  const res = 25; // ms between steps


  if (nextStates && nextStates.length) {
    const dimMasters = opts ? opts.dimMasters !== undefined ? opts.dimMasters : [] : [];
    for (let i = dimMasters.length ; i < nextStates.length ; i++) {
      dimMasters.push(1);
    }
    const transitionTime = Math.max((res + 1) / 1000 , Math.max(this.curSeq.timeOut, timeIn));
    stopTimer('seqTransition'); // will remove any unused curves from merged states
    const rsl = StateList.mergeStateList(nextStates, this.stateList.getCurrentFullFixtureList(), this.stateList.states, dimMasters);
    const mergedState = new MergedState(rsl);
    mergedState.checkIntegrity();
    doTimer('seqTransition', transitionTime * 1000.0, res,
      (total: number, t: number) => {
        let pct = t * 1.0 / total;
        pct = Math.max(0, Math.min(1, pct));
        // const time = t * res;
        // const pctIn = timeIn > 0 ? (1 - Math.max(0, (timeIn - time) / timeIn)) : 1;
        // const pctOut = timeOut>0?Math.max(0,(timeOut-time)/timeOut):0;
        doSharedFunction(() =>{
                  mergedState.applyCrossfade(pct)
                  this.pctDone = pct;
                },
          );
      },

      () => {
        doSharedFunction(() => {
          mergedState.endCB();
          if (cb) {cb(); }
        });
      },
      );

  }
}



}

export const sequencePlayer = SequencePlayerClass.i;
