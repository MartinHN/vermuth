import {isArrayLikeObject} from 'lodash';

import {ChannelBase} from './Channel';
import {DirectFixture, FixtureBase, FixtureBaseI} from './Fixture';
import {Proxyfiable} from './MemoryUtils'
import {AccessibleClass, doSharedFunction, nonEnumerable, RemoteArray, RemoteFunction, RemoteValue, SetAccessible,callOnServerOnly} from './ServerSync';
import {blackState,allBlackState, MergedState, ResolvedFixtureState, State, StateList} from './State';

import {doTimer, stopTimer} from './Time';
import {Universe} from './Universe';


@AccessibleClass()
export class Sequence extends Proxyfiable {
  public static createFromObj(o: any): any {
    const seq = new Sequence(o.name || 'no name', o.stateName);
    seq.configureFromObj(o);
    return seq;
    // o.pChannelValues.map( (oo: any) => res.pChannelValues.push(new
    // ChannelWithValue(oo.channelName, oo.value)) ); return res;
  }
  @RemoteValue() public timeIn = 0;
  @RemoteValue() public hold = 0;
  @RemoteValue() public timeOut = 0;
  @RemoteValue() public stateName = 'none';
  @RemoteValue() public name: string;

  @RemoteValue() public doNotPrepareNext = false;

  @nonEnumerable() public __state?: State;

  constructor(_name: string, state: string|State) {
    super();
    this.name = _name;
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


  public resolveState(stateResolver: (n: string) => State | undefined) {
    if (this.__state && this.stateName &&
        this.__state.name === this.stateName) {
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
  @SetAccessible({readonly: false}) private list = new Array<Sequence>();

  constructor() {}
  public configureFromObj(ob: any) {
    this.clearSequences();
    (ob.list || []).map((e: any) => this.list.push(Sequence.createFromObj(e)));
  }

  public get listGetter() {
    return this.list;
  }

  public insertAt(s: Sequence, i: number) { if (i >= 0 || i <= this.list.length) {
    let finalName = s.name
    while (this.list.findIndex((ss) => ss.name === finalName) != -1) {
      finalName = finalName + '.';
    }

    // splice dont work...
    // if (i === this.list.length) {
    //   this.list.push(s);
    // } else {
    //   this.list.splice(i, 0, s);
    // }
    
    this.list.push(s);
    if (i < this.list.length-1) {
      for(let j =this.list.length-1 ;j>i ; j--){
        this.swap(this.list[j],this.list[j-1])
      }
    }
    s.name = finalName;
    } else {
      console.error('invalid index', i);
    }
  }
  public getAtIdx(i: number) {
    return this.list[i];
  }
  public indexOf(s: Sequence) :number{
    const i = this.list.indexOf(s);
    if(i<0){
      for(const [ii,ss] of Object.entries(this.list)){
        if(s.name===ss.name){
          return parseInt(ii);
        }
      }
    } 
    return i;
  }

  @RemoteFunction({sharedFunction: true})
  public insertNewSequence(name: string, stateName: string, idx: number) {
    const s = new Sequence(name, stateName)
    return this.insertAt(s, idx)
  }
  public appendSequence(s: Sequence) {
    this.insertAt(s, this.list.length);
  }

  @RemoteFunction({sharedFunction: true})
  public remove(s: Sequence) {
    const i = this.indexOf(s);
    if (i >= 0) {
      this.list.splice(i, 1);
    }
  }
  @RemoteFunction({sharedFunction: true})
  public setSeqIdx(s: Sequence, i: number) {
    const ii = this.indexOf(s);
    if (ii >= 0) {
      this.remove(s);
      i = Math.min(this.list.length - 1, Math.max(0, i));
      this.insertAt(s, i);
    }
  }

  @RemoteFunction({sharedFunction: true})
  public swap(a: Sequence, b: Sequence) {
    const ia = this.indexOf(a);
    const ib = this.indexOf(b);
    if(ia<0 || ib < 0){

      console.error("not found in swap",JSON.stringify(a),JSON.stringify(b))
      throw new Error("not found for swap")
    }
    this.list[ia] = this.list.splice(ib, 1, this.list[ia])[0];

  }

  public up(s: Sequence) {
    const prev = this.indexOf(s) - 1;
    if (prev >= 0) {
      this.swap(s, this.list[prev]);
    }
  }
  public down(s: Sequence) {
    const next = this.indexOf(s) + 1;
    if (next < this.list.length) {
      this.swap(s, this.list[next]);
    }
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
  universe: Universe;
}

// @ts-ignore private constructor shit
@AccessibleClass()
export class SequencePlayerClass {
  static get i(): SequencePlayerClass {
    if (!SequencePlayerClass._instance) {
      SequencePlayerClass._instance = new SequencePlayerClass();
    }
    return SequencePlayerClass._instance;
  }

  get stateList() {
    if (this._rootProvider === undefined) {
      console.error('stateListNotInited');
      debugger;
    }
    return this._rootProvider ? this._rootProvider.stateList : {
      states: {} as {[key: string]: State},
      getCurrentFullFixtureList: () => []
    };
  }
  get sequenceList() {
    if (this._rootProvider === undefined) {
      console.error('stateListNotInited');
      debugger;
    }
    return this._rootProvider ? this._rootProvider.sequenceList :
                                new SequenceList();
  }

  get universe() {
    if (this._rootProvider === undefined) {
      console.error('stateListNotInited');
      debugger;
    }
    return this._rootProvider ? this._rootProvider.universe : new Universe();
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

  @RemoteFunction({sharedFunction: true})
  next(allowLoop?:boolean) {
    if(allowLoop){
      this.curPlayedIdx = (this.curPlayedIdx + 1) % (this.sequenceList.length )
    }
    else{
      this.curPlayedIdx =
          Math.min(this.sequenceList.length - 1, this.curPlayedIdx + 1);
    }
  }
  @RemoteFunction({sharedFunction: true})
  prev() {
    this.curPlayedIdx = Math.max(0, this.curPlayedIdx - 1);
  }
  private static _instance: SequencePlayerClass|undefined;


  @nonEnumerable() public curSeq: Sequence = blackSeq;
  @nonEnumerable() public nextSeq: Sequence = blackSeq;

  public pctDone = 0;

  @RemoteValue() public playState = 'stopped';
  @RemoteValue() public numLoops = 0;
  @RemoteValue() private pcurPlayedIdx = -1;

  @RemoteValue() private pisPlaying = false;

  @nonEnumerable() private _rootProvider?: RootProvider = undefined;

  // private constructor() {}

  @RemoteFunction({sharedFunction: true})
  public goToStateNamed(
      name: string, timeIn: number, opts?: {dimMaster?: number},
      cb?: () => void): void {
    if (typeof (opts) == 'number') {
      opts = {dimMaster: opts};
      console.log('auto fixing opts in stateNamed', opts)
    }
    const seq = new Sequence('tmp', '' + name);
    if (!timeIn) {
      timeIn = 0;
    }
    seq.timeIn = timeIn;
    this.goToSequence(seq, opts, cb);
  }

  @RemoteFunction({sharedFunction: true})
  public goToSequenceNamed(
      name: string, opts?: {dimMaster?: number}, cb?: () => void): void {
    if (typeof (opts) == 'number') {
      opts = {dimMaster: opts};
      console.log('auto fixing opts seqNamed', opts)
    }
    name = '' + name;
    const tSeq = this.sequenceList.find((s) => s.name === name);
    if (!tSeq) {
      console.error('seq not found');
      return;
    }
    this.goToSequence(tSeq, opts, cb);
  }

  @RemoteFunction({/* skipClientApply: true */})
  public stopIfPlaying(toBlack?:boolean) {
    this.numLoops = 0;
    
    if(toBlack){
      console.log("blacbbbbbking out to ",toBlack)
       this.goToStateNamed("__allBlack", 1.0);
    }
    else{
      stopTimer('seqTransition',true);
    }
  }

  @RemoteFunction({/* skipClientApply: true */})
  public startLoop() {
    this.numLoops = -1;
    this.curPlayedIdx = 0;
  }

  public linkToRoot(rootProvider: RootProvider) {
    if (this._rootProvider !== undefined) {
      console.error('double init of sequencePlayer');
      debugger;
    }
    if (rootProvider === undefined) {
      console.error('setting empty root');
      debugger;
    }
    this._rootProvider = rootProvider;
  }

  @RemoteFunction({sharedFunction: true})
  private goToSequence(seq: Sequence, opts?: {dimMaster?: number}, cb?: any) {
    if (!seq) {
      console.error('go to null sequence')
      debugger;
      return
    }
    if (!seq.resolveState) {
      console.error('non valid sequence', seq)
      debugger;
      return
    }
    this.nextSeq = seq;
    const stateResolver = (n: string) => {
      return this.stateList.states[n];
    };

    const nIdx = this.sequenceList.indexOf(seq);
    if (nIdx >= 0) {
      this.pcurPlayedIdx = nIdx;
    }

    // const timeOut =  this.curSeq.timeOut*1000;
    const timeIn = this.nextSeq.timeIn;
    const nextState = this.nextSeq.resolveState(stateResolver);
    if (nextState) {
      const dimMaster =
          opts ? opts.dimMaster !== undefined ? opts.dimMaster : 1 : 1;

      this.goToStates(
          [nextState], this.nextSeq.timeIn, {dimMasters: [dimMaster]},
          (shouldCancel) => {
            doSharedFunction(() => {
              this.pisPlaying = false;
              
              if (!this.nextSeq.doNotPrepareNext) {
                this.resolveSlowChanges(nIdx + 1)
              }
                        
              if (cb) {
                cb(shouldCancel);
              }
            });
          if(!shouldCancel){
            callOnServerOnly(
              ()=>setTimeout( 
                ()=>{
                this.endLoop(nIdx) }
                ,1)
              );
            }
          });
    }
  }

  
  @RemoteFunction({skipClientApply:true})
  private endLoop(nIdx:number){
    debugger;
    if(this.numLoops == -1){
      this.curPlayedIdx = (this.curPlayedIdx + 1) % (this.sequenceList.length )
    }
  }

  
  private resolveSlowChanges(toIdx: number) {
    const stateResolver = (n: string) => {
      return this.stateList.states[n];
    };

    const blackFixtures = new Array<FixtureBase>()
    for (const f of Object.values(this.universe.fixtureList)) {
      if (f.hasDimmerChannels) {
        let isLit = false;
        f.dimmerChannels.map(c => {isLit = isLit || c.floatValue > 0})
        if (!isLit) {
          blackFixtures.push(f);
        }
      }
    }
    const seq = this.sequenceList.getAtIdx(toIdx)
    const resolvedStates =
        seq?.resolveState(stateResolver)
            ?.resolveState(this.universe.fixtureList, this.stateList.states, 1);
    if (resolvedStates) {
      for (const b of blackFixtures) {
        const match = resolvedStates.find(r => r.fixture == b)
        if (match) {
          let isLit = false
          if (b.dimmerChannels.map(d => {
                const tV = match.channels[d.name]?.value
                if (tV !== undefined && tV > 0) {
                  isLit = true;
                }
              }))
          if (isLit) {  // wil be lit on the next state so prepare other
                        // channels
            for (const [k, v] of Object.entries(match.channels)) {
              if (typeof (v.value) === 'number') {
                const c = b.getChannelForName(k);
                if (c && !(c.reactToMaster)) {
                  c.setValue(v.value, true);
                }
              }
            }
          }
        }
      }
    }
    // this.sequenceList.getAtIdx()
  }

  @RemoteFunction({sharedFunction: true})
  private goToStates(
      nextStates: State[], timeIn: number, opts?: {dimMasters?: number[]},
      cb?: (shouldCancel:boolean)=>void) {
    // #if IS_CLIENT
    const res = 50;  // ms between steps
    // #else
    const res = 10;  // ms between steps
    // #endif

    if (nextStates && nextStates.length) {
      const dimMasters =
          opts ? opts.dimMasters !== undefined ? opts.dimMasters : [] : [];
      for (let i = dimMasters.length; i < nextStates.length; i++) {
        dimMasters.push(1);
      }
      const transitionTime =
          Math.max((res + 1) / 1000, Math.max(this.curSeq.timeOut, timeIn));
      stopTimer(
          'seqTransition',true);  // will remove any unused curves from merged states
      const rsl = StateList.mergeStateList(
          nextStates, this.stateList.getCurrentFullFixtureList(),
          this.stateList.states, dimMasters);
      const mergedState = new MergedState(rsl);
      mergedState.checkIntegrity();
      this.pisPlaying = true;
      doTimer(
          'seqTransition',
          transitionTime * 1000.0,
          res,
          (total: number, t: number) => {
            let pct = t * 1.0 / total;
            pct = Math.max(0, Math.min(1, pct));
            // const time = t * res;
            // const pctIn = timeIn > 0 ? (1 - Math.max(0, (timeIn - time) /
            // timeIn)) : 1; const pctOut =
            // timeOut>0?Math.max(0,(timeOut-time)/timeOut):0;
            doSharedFunction(
                () => {
                  mergedState.applyCrossfade(pct);
                  this.pctDone = pct;
                },
            );
          },

          (shouldCancel) => {
            doSharedFunction(() => {
              mergedState.endCB();
              if (cb) {
                cb(shouldCancel);
              }

              this.pisPlaying = false;
            });
          },
      );
    }
  }
}

export const sequencePlayer = SequencePlayerClass.i;
