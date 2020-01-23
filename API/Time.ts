import EventEmitter from 'events';
import {RemoteValue, RemoteFunction, doSharedFunction, nonEnumerable} from './ServerSync';

const timers: {[key: string]: any} = {};

export function  doTimer(name: string, length: number, resolution: number, oninstance: (steps: number, count: number) => void, oncomplete?: () => void ) {
  const steps = length / resolution;
  const speed = resolution;
  let count = 0;
  const start = new Date().getTime();

  function instance() {
    if (++count === steps) {
      oninstance(steps, count);
      if (oncomplete) {oncomplete(); }
    } else {
      oninstance(steps, count);

      const diff = (new Date().getTime() - start) - (count * speed);
      timers[name] = setTimeout(instance, Math.max(0, speed - diff));
    }
  }
  oninstance(steps, count);
  stopTimer(name);
  timers[name] = setTimeout(instance, speed);
}

export function stopTimer(name: string) {
  if (timers[name]) {
    clearTimeout(timers[name]);
    delete timers[name];
  }
}

function getMs() {
  return  new Date().getTime();
}

class GlobalTransportClass extends EventEmitter {
  @nonEnumerable()
  public static timeGranularityMs = 20;

  @nonEnumerable()
  private _startMs = getMs();
  @nonEnumerable()
  private _interval?: any;
  @nonEnumerable()
  private _timeListeners = new Map<TimeListener, Map<string, (...args: any[]) => void>>();

  @RemoteValue()
  private _bpm = 60;

  @RemoteValue((parent: any, t: any) => {
    doSharedFunction(
      () => {
       parent.emit('time', t);
     },
     );
  })
  private _time = 0;


  constructor(){
    super()
    this.start()
  }

  @RemoteValue((parent: any, v: any) => {
    doSharedFunction(() => parent.emit('isPlaying', v));
  })
  private _isPlaying = false;

  get isPlaying() {return this._isPlaying; }
  get time(){return this._time}

  @RemoteFunction({skipClientApply: true})
  public start() {
    this.stop();
    this._startMs = getMs();
    this._isPlaying = true;
    this._interval  = setInterval(this._updateTime.bind(this), GlobalTransportClass.timeGranularityMs);
  }
  get bpm() {return this._bpm; }
  set bpm(v: number) {this._bpm = v; }
  get beatInterval() {return 60000 / this._bpm; }
  get beat() {return this._time * this._bpm / 60000; }

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

    for ( const [k, v] of functions.entries()) {this.on(k, v); }
      this._timeListeners.set(l, functions);
  }
  public removeTimeListener(l: TimeListener) {
    const functions = this._timeListeners.get(l);
    if (functions) {
      for ( const [k, v] of functions.entries()) {this.off(k, v); }
    }
}

}
export const GlobalTransport = new GlobalTransportClass();

export class TimeListener {
  constructor(public name: string) {
    GlobalTransport.addTimeListener(this);
  }
  public timeChanged(t: number) {console.log('base time changed'); }
  public playStateChanged(s: boolean) {}
  public dispose() {
    GlobalTransport.removeTimeListener(this);
  }


}


