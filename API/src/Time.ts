import {EventEmitter} from 'events';
import dbg from './dbg'
const debugTime = dbg('TIMER')
import{AccessibleClass, doSharedFunction, nonEnumerable, RemoteFunction, RemoteValue} from './ServerSync';

const timers: {[key: string]: {timeout: any; endCB?: (shouldCancel:boolean) => void}} = {};
const CONSTANT_TIME_INC =
    // #if IS_CLIENT
    false
// #else
false
// #endif
export function doTimer(
    name: string, length: number, resolution: number,
    oninstance: (steps: number, count: number) => void,
    oncomplete?: (shouldCancel:boolean) => void) {
  const steps = length / resolution;
  const speed = resolution;
  let count = 0;
  const start = new Date().getTime();
  let lastTime = start;
  const instance = () => {
    const trueCount = count
    count++;
    const now = new Date().getTime()
    const elapsedTime = (now - start)
    const estimatedCount = Math.min(steps, elapsedTime / resolution)
    const estimatedOrTrueCount = CONSTANT_TIME_INC ? trueCount : estimatedCount;
    if (trueCount >= steps ||
        (!CONSTANT_TIME_INC && (estimatedCount >= steps))) {
      oninstance(steps, steps);
      stopTimer(name,false);
      // if (oncomplete) {oncomplete(); }
    } else {
      oninstance(steps, estimatedOrTrueCount);
      const diffRunningTime = elapsedTime - (trueCount * speed)
      const deltaNext = speed - (CONSTANT_TIME_INC ? 0 : diffRunningTime);
      debugTime(
          'diff', diffRunningTime, 'estCount', estimatedOrTrueCount, 'err',
          (now - lastTime) - speed, 'ms', 'nextDelta', deltaNext, 'ms');
      timers[name].timeout = setTimeout(instance, Math.max(0, deltaNext));
      lastTime = now
    }
  };
  stopTimer(name,true);
  timers[name] = {
    timeout: null,
    endCB: (shouldCancel:boolean) => {
      console.log('end timer');
      if (oncomplete) {
        oncomplete(shouldCancel);
      }
    }
  };
  console.log('timer', name, speed, 'ms');
  instance();
  // oninstance(steps, count);
}

export function
stopTimer(name: string, shouldCancel:boolean) {
  if (timers[name]) {
    clearTimeout(timers[name].timeout);
    const endCB = timers[name].endCB;
    delete timers[name];
    if (endCB) {
      endCB(shouldCancel);
    }
  }
}

function
getMs() {
  return new Date().getTime();
}

// @ts-ignore
@AccessibleClass() export class GlobalTransportClass extends EventEmitter {
  static get i(): GlobalTransportClass {
    if (!GlobalTransportClass._instance) {
      GlobalTransportClass._instance = new GlobalTransportClass();
    }
    return GlobalTransportClass._instance;
  }

  get isPlaying() {
    return this._isPlaying;
  }
  get time() {
    return this._time;
  }
  get bpm() {
    return this._bpm;
  }
  set bpm(v: number) {
    this._bpm = v;
  }
  get beatInterval() {
    return 60000 / this._bpm;
  }
  get beat() {
    return this._time * this._bpm / 60000;
  }

  @nonEnumerable() public static timeGranularityMs = 20;
  private static _instance: GlobalTransportClass|undefined;

  @nonEnumerable() private _startMs = getMs();
  @nonEnumerable() private _interval?: any;
  @nonEnumerable()
  private _timeListeners =
      new Map<TimeListener, Map<string, (...args: any[]) => void>>();

  @RemoteValue() private _bpm = 60;

  @RemoteValue((parent: any, t: any) => {
    doSharedFunction(
        () => {
          parent.emit('time', t);
        },
    );
  })
  private _time = 0;



  @RemoteValue((parent: any, v: any) => {
    doSharedFunction(() => parent.emit('isPlaying', v));
  })
  private _isPlaying = false;
  protected constructor() {
    super();
    // this.start();
  }

  @RemoteFunction({skipClientApply: true})
  public start() {
    this.stop();
    this._startMs = getMs();
    this._isPlaying = true;
    this._interval = setInterval(
        this._updateTime.bind(this), GlobalTransportClass.timeGranularityMs);
  }

  @RemoteFunction({skipClientApply: true})
  public stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._time = 0;
      this._isPlaying = false;
    }
  }

  public _updateTime() {
    this._time = (getMs() - this._startMs);
  }

  public addTimeListener(l: TimeListener) {
    const functions = new Map();
    functions.set('time', l.timeChanged.bind(l));
    functions.set('isPlaying', l.playStateChanged.bind(l));

    for (const [k, v] of functions.entries()) {
      this.on(k, v);
    }
    this._timeListeners.set(l, functions);
  }
  public removeTimeListener(l: TimeListener) {
    const functions = this._timeListeners.get(l);
    if (functions) {
      for (const [k, v] of functions.entries()) {
        this.off(k, v);
      }
    }
  }
}
export const GlobalTransport = GlobalTransportClass.i;

export class TimeListener {
  constructor(public name: string) {
    GlobalTransport.addTimeListener(this);
  }
  public timeChanged(t: number) {
    console.log('base time changed');
  }
  public playStateChanged(s: boolean) {}
  public __dispose() {
    GlobalTransport.removeTimeListener(this);
  }
}
