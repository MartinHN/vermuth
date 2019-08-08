import { State, blackState, ResolvedFixtureState, MergedState } from './State';
import { DirectFixture } from './Fixture';
import { ChannelBase } from './Channel';
import {  doTimer } from './Time';
import { RemoteFunction, RemoteValue, nonEnumerable } from './ServerSync';
import rootState from './RootState';


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
    if (this.__state && this.__state.name === this.stateName) {
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

export class SequencePlayer {
  public curSeq: Sequence = blackSeq;
  public nextSeq: Sequence = blackSeq;

  @RemoteValue()
  public playState: string = 'stopped';

  @RemoteFunction({skipClientApply: true})
  public goToStateNamed(name: string, timeIn: number, cb?: () => void): void {
    const seq = new Sequence('tmp', name);
    seq.timeIn = timeIn;
    this.goToSequence(seq);
  }
@RemoteFunction({skipClientApply: true})
  public goToSequenceNamed(name: string, cb?: () => void): void {

    const tSeq = rootState.sequenceList.find((s) => s.name === name);
    if (!tSeq) {
      console.error('seq not found');
      return;
    }
    this.goToSequence(tSeq);

  }


  private goToSequence(seq: Sequence, cb?: any) {
    this.nextSeq = seq;
    const stateResolver = (n: string) => {
      return rootState.stateList.states[n];
    };

    // const timeOut =  this.curSeq.timeOut*1000;
    const timeIn =  this.nextSeq.timeIn ;
    const nextState = this.nextSeq.resolveState(stateResolver);
    if (nextState) {
    this.goToState(nextState, this.nextSeq.timeIn, cb);
  }
  }

  private goToState(nextState: State, timeIn: number, cb?: any) {
    const res = 50; // ms between steps

    if (nextState) {
      const transitionTime = Math.max(this.curSeq.timeOut, timeIn);
      const nextStateResolved = nextState.resolveState(rootState.stateList.getCurrentFixtureList());
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
              ts.channel.setFloatValue(v, true);

              // channelDic[k].sendValue(v)
            }

          }
        },
        cb,
        );
    }
  }


}
