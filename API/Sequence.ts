import { State, StateList, blackState, ResolvedFixtureState, MergedState } from './State';
import { DirectFixture } from './Fixture';
import { ChannelBase } from './Channel';
import {  doTimer, stopTimer } from './Time';
import { RemoteFunction, RemoteValue, nonEnumerable } from './ServerSync';



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

interface RootProvider {
  stateList: StateList;
  sequenceList: Sequence[];
}

class SequencePlayer {

  get stateList() {
    if (this._rootProvider === undefined) {console.error('stateListNotInited'); debugger; }
    return this._rootProvider ? this._rootProvider.stateList : {states: {} as {[key: string]: State}, getCurrentFixtureList: () => []};
  }
  get sequenceList() {
    if (this._rootProvider === undefined) {console.error('stateListNotInited'); debugger; }
    return this._rootProvider ? this._rootProvider.sequenceList : [];
  }
  public curSeq: Sequence = blackSeq;
  public nextSeq: Sequence = blackSeq;

  @RemoteValue()
  public playState: string = 'stopped';

  @nonEnumerable()
  private _rootProvider?: RootProvider = undefined;

  @RemoteFunction({skipClientApply: true})
  public goToStateNamed(name: string, timeIn: number, cb?: () => void): void {
    const seq = new Sequence('tmp', '' + name);
    if (! timeIn) {
      timeIn = 0;
    }
    seq.timeIn = timeIn;
    this.goToSequence(seq, cb);
  }

  @RemoteFunction({skipClientApply: true})
  public goToSequenceNamed(name: string, cb?: () => void): void {
    name = '' + name;
    const tSeq = this.sequenceList.find((s) => s.name === name);
    if (!tSeq) {
      console.error('seq not found');
      return;
    }
    this.goToSequence(tSeq, cb);

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


  private goToSequence(seq: Sequence, cb?: any) {
    this.nextSeq = seq;
    const stateResolver = (n: string) => {
      return this.stateList.states[n];
    };

    // const timeOut =  this.curSeq.timeOut*1000;
    const timeIn =  this.nextSeq.timeIn ;
    const nextState = this.nextSeq.resolveState(stateResolver);
    if (nextState) {
      this.goToState(nextState, this.nextSeq.timeIn, cb);
    }
  }

  private goToState(nextState: State, timeIn: number, cb?: any) {
    const res = 100; // ms between steps

    if (nextState) {
      const transitionTime = Math.max((res + 1) / 1000 , Math.max(this.curSeq.timeOut, timeIn));
      const nextStateResolved = nextState.resolveState(this.stateList.getCurrentFixtureList(),this.stateList.states,1);
      const mergedState = new MergedState(nextStateResolved);
      mergedState.checkIntegrity();
      doTimer('seqTransition', transitionTime * 1000.0, res,
        (total: number, t: number) => {
          const pct = t * 1.0 / total;
          const time = t * res;
          // const pctIn = timeIn > 0 ? (1 - Math.max(0, (timeIn - time) / timeIn)) : 1;
          // const pctOut = timeOut>0?Math.max(0,(timeOut-time)/timeOut):0;

          for (const ts of mergedState.channels) {
            if ( ts.sourcev !== ts.targetv) {
              const diff = ts.targetv - ts.sourcev;
              const v = ts.sourcev + pct * diff;
              ts.channel.setValue(v, true);

              // channelDic[k].sendValue(v)
            }

          }
        },
        cb,
        );
    }
  }


}

export const sequencePlayer = new SequencePlayer();
