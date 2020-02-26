// #if IS_CLIENT
const isClient = true;
// #else
const isClient = process.env.VUE_APP_ISCLIENT;
// #endif

// import {isProxySymbol,isProxyfiable,Proxyfiable} from './ServerSync'
function getVue() {

  if (!isClient) {return false; }

  try {
    // #if IS_CLIENT
    return require( 'vue').default;
    // #endif
  } catch (e) {
    throw new Error('can\'t require Vue');
  }
  return false;
}


export function deleteProp(o: any, p: string|symbol) {
  if (o[p] && o[p].__dispose) {
    o[p].__dispose();
  }
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.delete(o, p);
    return;
  }
  // #endif
  Reflect.deleteProperty(o, p);

}


export function addProp(o: any, p: string|symbol, v: any) {
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.set(o, p, v);
    return;
  }
  // #endif
  Reflect.set(o, p, v);

}


export function nextTick(cb: any) {
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue) {
    Vue.nextTick(cb);
    return;
  }
  // #endif

    // @ts-ignore
  process.nextTick(cb);


}



export const isProxyfiable =  Symbol('isProxyfiable');
const sourceHandlerSymbol = Symbol('sourceHandler');
export class Proxyfiable {
  private [sourceHandlerSymbol]: any;
  set sourceHandler(v: any) {
    this[sourceHandlerSymbol] = v;
  }
  constructor(sourceHandler?: any) {
    return new Proxy(this, {
       set(obj: any, prop: symbol|string, value: any, thisProxy: any) {
        if (sourceHandler && sourceHandler.set) {return sourceHandler.set(obj, prop, value, thisProxy); }
        return Reflect.set(obj, prop, value, thisProxy);
      },
      get: (target: any, k: symbol|string, thisProxy: any) => {
        if (k === isProxyfiable) {return true; }
        if (sourceHandler && sourceHandler.get) {return sourceHandler.get(target, k, thisProxy); }
        return Reflect.get(target, k, thisProxy);
      },
      deleteProperty(target: any, k: symbol|string) {
        if (sourceHandler && sourceHandler.deleteProperty) {return sourceHandler.deleteProperty(target, k); }
        return Reflect.deleteProperty(target, k);
      },
      apply: (target, thisArg, argumentsList) => {
         if (sourceHandler && sourceHandler.apply) {return sourceHandler.apply(target, thisArg, argumentsList); }
         return Reflect.apply(target, thisArg, argumentsList);
      },
    });
  }
}

interface WithUID {
  uid: string;
}
export interface Refable {
  uid: string;
  __references: any[];

}

export interface Disposable {
  __dispose(): void;
}

export interface Configurable {
  configureFromObj(o: any): void;
}





type IConstructor<T> = new (...args: any[]) => T;
type FElemType =  WithUID & Disposable;

export class Factory <T extends  FElemType> {
  public factory: {[id: string]: T} = {};
  constructor(private createFromObj: (a: any) => T|undefined) {

  }
  public clear() {
    for (const u of Object.keys(this.factory)) {
      delete this.factory[u];
    }
  }

  public configureFromObj(o: any) {
    this.clear();
    if (o.factory) {
      for (const [k, v] of Object.entries(o.factory)) {
        const t = this.createFromObj(v); // new this.TConstructor()
        if (t) {
        this.add(t);
      } else {console.error('no created'); debugger; }
      }
    }
  }

  public add(o: T) {
    this.factory[o.uid] = o;
    return o;
  }
  public remove(o: T, doDispose = true) {
    const cl = this.factory[o.uid];
    if (cl) {
      let df: any;
      if (!doDispose) {
       df = cl.__dispose;
       cl.__dispose = () => {}; }

      delete this.factory[o.uid];
      if (!doDispose) {
        cl.__dispose = df;
      }
    }
  }

  public getForUID(u: string): T {
    return this.factory[u];
  }
  public getUIDs() {return Object.keys(this.factory); }


}

const refDisposedSymbol = Symbol('refDisposed');

export function generateFromUIDList<T extends FElemType>(uids: string[], f: Factory<T>) {
    return uids.map((u) => f.getForUID(u));
}

export function getUnusedRefs<T extends Refable>(l: T[]) {
    return l.filter((e) => e.__references.length === 0);
}


export class Ref <T extends Refable> extends Proxyfiable {
  private [refDisposedSymbol] = false;
  constructor(private __r: T) {
    super();
    this.__r.__references.push(this);

  }
  public toJSON() {
    return this.__r.uid;
  }
  public getPointed() {return this.__r; }
  public __dispose() {
    if (this[refDisposedSymbol]) {
      console.error('double dispose');
      debugger;
    }
    this[refDisposedSymbol] = true;
    const i = this.__r.__references.indexOf(this);

    if (i < 0) {console.error('unreferenced'); return; }
    this.__r.__references.splice(i, 1);


  }
}
