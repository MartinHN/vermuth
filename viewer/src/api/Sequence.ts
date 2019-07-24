import { State, blackState, ResolvedFixtureState, MergedState } from './State';
import { DirectFixture } from './Fixture';
import { ChannelBase } from './Channel';
import { Time, doTimer } from './Time';




export class Sequence {

  public static fromObj(o: any): any {

    const seq = new Sequence(o.name, o.stateName);
    seq.timeIn = o.timeIn;
    seq.timeOut = o.timeOut;
    seq.hold = o.hold;
    return seq;
    // o.pChannelValues.map( (oo: any) => res.pChannelValues.push(new ChannelWithValue(oo.channelName, oo.value)) );
    // return res;
  }

  public timeIn: number = 0;
  public hold: number = 0;
  public timeOut: number = 0;
  public stateName: string = 'none';
  public __state?: State;
  constructor(public name: string, state: string|State) {
    if (typeof state === 'string') {
      this.stateName = state;
    } else if (state) {
      this.stateName = state.name;
      this.__state = state;
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

  public playState: string = 'stopped';

  public goTo(nSeq: Sequence, fl: DirectFixture[], stateResolver: (n: string) => State|undefined, sendValueCB: (f: ChannelBase, v: number) => void, cb: () => void): void {
    this.nextSeq = nSeq;
    const res = 10;
    const transitionTime = Math.max(this.curSeq.timeOut, this.nextSeq.timeIn);


    // const timeOut =  this.curSeq.timeOut*1000;
    const timeIn =  this.nextSeq.timeIn * 1000;
    const nextState = this.nextSeq.resolveState(stateResolver);

    if (nextState) {
      const nextStateResolved = nextState.resolveState(fl);
      const mergedState = new MergedState(nextStateResolved);
      mergedState.checkIntegrity();
      doTimer('seqTransition', transitionTime * 1000.0, res,
        (total: number, t: number) => {
          const pct = t * 1.0 / total;
          const time = t * res;
          const pctIn = timeIn > 0 ? (1 - Math.max(0, (timeIn - time) / timeIn)) : 1;
          // const pctOut = timeOut>0?Math.max(0,(timeOut-time)/timeOut):0;

          for (const ts of mergedState.channels) {
            if ( ts.sourcev !== ts.targetv) {
              const diff = ts.targetv - ts.sourcev;
              const v = ts.sourcev + pctIn * diff;
              sendValueCB(ts.channel, v);
              // channelDic[k].sendValue(v)
            }

          }


        },
        );
    }
  }



}
