const isClient = process.env.VUE_APP_ISCLIENT;
const logServerMessages = process.env.LOG_MSG;
let clientSocket: any = null ;
// let ioServer: any = null;
const listenedNodes: {[id: string]: any} = {};
import {addProp, deleteProp, nextTick} from './MemoryUtils';
let allListeners = new  Map<string, any>();
let AccessibleSettedByServer: any = null;
let AccessibleNotifierId: string|null = null;
let lockCallbacks = 0;
import * as _ from 'lodash';
import { Socket } from 'socket.io';
import 'reflect-metadata';

export function bindClientSocket(s: any) {

  if (s !== 'auto' && s) { // only on new socke
    const boundSocket = s;
    if (!isClient) {
      const emitF = boundSocket.emit;
      const log = require('./Logger').default;
      console.log('highjacking server socket');
      const nF = (e: string, a: any, l: any) => {
        if (logServerMessages) {
          log.log('server >> all clients : ' + e + ' : ' + a + '\n');
        }
        emitF.apply(boundSocket, [e, a, l]);
      };

      boundSocket.emit = nF;
    } else {
      const onevent = boundSocket.onevent;

      const rS = require('./RootState').default;
      if (!boundSocket.__eventOverriden) {
        boundSocket.__eventOverriden =  true;
        boundSocket.onevent =  (packet: any) => {
          const args = (packet.data || []).slice();

          const addr = args.shift();
          if (addr && (addr[0] === '/')) {
            callAnyAccessibleFromRemote(rS, addr, args[0], boundSocket.id);
          } else {

           onevent.call (boundSocket, packet);    // original call
         }
         // packet.data = ["*"].concat(args);
         // onevent.call(this, packet);      // additional call to catch-all
       };
     }
   }

 }
  safeBindSocket(s);


}

const sendToSocketDebounced = _.debounce(
  (addr: string, targs: any) => {clientSocket.emit(addr, targs); },
  10 ,
  {trailing: true, maxWait: 30});

const getFunctionParams = (func: (...args: any[]) => any) => {
  const ARGUMENT_NAMES = /([^\s,]+)/g;
  const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null) {return []; }
  return result;

};


const rebuildAccessibles = () => {
  const valSymbol = Symbol('values');
  const funSymbol = Symbol('functions');


  const recurseAccessible = (o: any) => {
    if (o === undefined) {
      console.error('accessible parsing error');
      // debugger;
      return;
    }
    if (o.__accessibleMembers) {
      for ( const name of Object.keys(o.__accessibleMembers)) {
        const last = curNode;
        curNode [name] = {type: o.__accessibleTypes[name]};
        curNode = curNode [name];
        recurseAccessible(o.__accessibleMembers[name]);
        curNode = last;
      }
    }
    // debugger
    if (o.__registerRemoteValuesAddr) {
      curNode[valSymbol] = [];
      for (const l of Object.keys( o.__registerRemoteValuesAddr)) {
        curNode[valSymbol].push({v: l, type: o.__accessibleTypes[l].name});
        o.__registerRemoteValuesAddr[l]();
      }
    }
    if (o.__registerFunctionAddr) {
      curNode[funSymbol] = [];
      for (const l of Object.keys( o.__registerFunctionAddr)) {
        const f = o.__remoteFunctions[l];
        curNode[funSymbol].push({v: l, f, params: getFunctionParams(f), type: o.__accessibleTypes[l].name});
        o.__registerFunctionAddr[l](o);
      }
    }

  };


  allListeners = new Map() ;
  const accessibleTree: any = {};
  let curNode = accessibleTree;
  const rS = require('./RootState').default;
  recurseAccessible(rS);
  console.log('listen to messages' , accessibleTree); // Array.from(allListeners.keys()));
};

const rebuildAccessiblesDebounced = _.debounce(rebuildAccessibles,
  200,
  {trailing: true},
  );


export function callAnyAccessibleFromRemote(root: any, saddr: string, args: any[], notifierId: string) {// args is passed as array
  if (saddr[0] === '/') {
    const addr = saddr.split('/');

    if (addr.length && addr[0] === '') {addr.shift(); }


    const {accessible, parent, key}  = resolveAccessible(root, addr);

    if (accessible !== undefined ) {
      if (AccessibleSettedByServer === addr ) {
        console.warn('avoid feedback');
        return;
      }
      if (typeof(accessible) === 'function') { // call method

        AccessibleNotifierId = notifierId;
        AccessibleSettedByServer = saddr;
        const res =  accessible.call(parent, ...args);
        AccessibleNotifierId = null;
        AccessibleSettedByServer = null;
        return res;

      } else if ( (args !== undefined && args !== null)) { // set value
        if (parent && key) {
          if (accessible !== args) {
            AccessibleNotifierId = notifierId;
            AccessibleSettedByServer = saddr;
            parent[key] = args;
            AccessibleNotifierId = null;
            AccessibleSettedByServer = null;
          }
        } else {
          console.error('malformed Accessible resolution');
        }
      } else { // return value
        return accessible;

      }
    } else {
      console.error('not found accessible for :', saddr);
    }
  }
}

function safeBindSocket(s: any) {
  if (clientSocket !== null && s !== 'auto') {console.error('reassigning socket'); }
  if (s !== 'auto') {clientSocket = s; }
  // rebuildAccessibles();

}

function buildAddressFromObj(o: any, errorIfEmpty = true) {
  let insp = o;
  let addr = [];
  let found;
  while (insp && !insp.__isRoot) {
    found = false;
    if (insp.__accessibleName) {
      addr.push(insp.__accessibleName);
      found = true;
    } else if (Array.isArray(insp.__accessibleParent)) {
      addr.push('' + insp.__accessibleParent.indexOf(insp));
      found = true;
    } else if (insp.__accessibleParent) {
      const pair = Object.entries(insp.__accessibleParent).find(([k, v]) => v === insp);
      if (pair) {
        addr.push(pair[0]);
        found = true;
      } else {
        debugger;
        console.error('not found');
      }

    }

    insp = insp.__accessibleParent;
  }
  if (addr && addr.length) {
    addr = addr.reverse();
    return '/' + addr.join('/');
  } else if (insp && insp.__isRoot) {
    return '';
  } else {
    if (errorIfEmpty) {
      debugger;
      // throw new Error(
      console.error(
        'can\'t find address on object' + o);
    }
    return null;
  }

}



const broadcastMessageFromServerDebounced = _.debounce((addr: string, args: any) => {broadcastMessageFromServer(addr, args); }
  , 50, {trailing: true, maxWait: 100});
function broadcastMessageFromServer(addr: string, args: any) {
  // let log;
  if (!addr) {
    debugger;
  } else {
    // if (logServerMessages) {log = require('./Logger').default; }
    if (!isClient && clientSocket && clientSocket.sockets) {
      // broadcast to other clients if we are server
      for (const s of Object.values(clientSocket.sockets.sockets)) {
        const sock = s as Socket;
        if (sock.id !== AccessibleNotifierId) {
          // if (log) { log.log('server >> ' + sock.id + ' : ' + addr + ' : ' + args + '\n');}
          sock.emit(addr, args);

        }
      }
    }

    // console.warn("avoid feedback");
  }
}




function defineObjTable(obj: any, tableName: string) {
  if (!obj[tableName]) {
    Object.defineProperty(obj, tableName, {
      value: {},
      enumerable: false,
      configurable: false,
      writable: true,
    } );
  }

  return obj[tableName];
}

function defineOnInstance(target: any, key: string | symbol, onInstance: (o: any, defaultV: any) => any) {
  let instanciated = false;
  let value: any = null;
  function checkPropChange(parent: any) {
    const desc = Object.getOwnPropertyDescriptor(parent, key);
    const propOverriden =  desc && desc.get !== getter && desc.set !== getter;
    if (!propOverriden) {
      debugger;
    }
    return propOverriden;
  }
  function getter(this: any) {
    // if(!instanciated){
    //   instanciated=true;
      value = onInstance(this, null);
      checkPropChange(this);
    // }
      return value;
  }
  function setter(this: any, nv: any) {

    // if(!instanciated){
      instanciated = true;
      value = onInstance(this, nv);
      checkPropChange(this);
    // }
    // else{
    //   value=nv;
    // }
  }

  Object.defineProperty(target, key, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,

  } );

}


export function SetAccessible(opts?: {readonly?: boolean}) {
  const readonly = opts && opts.readonly;
  return (target: any, key: string | symbol) => {
    defineOnInstance(target, key, (parent: any, defaultValue: any) => {
      return setChildAccessible(parent, key, {immediate: false, defaultValue, readonly});
    },
    );
  };

}


export function RemoteValue(cb?: (parent: any, value: any) => void) {
  return (target: any, k: string | symbol) => {
    let type = Reflect.getMetadata('design:type', target, k);
    defineOnInstance(target, k,
      (parent: any, defaultValue: any) => {
        if (type === Object && defaultValue !== undefined && defaultValue.__proto__) {
          type = defaultValue.__proto__.constructor;
        }
        let storedValue: any = defaultValue;
        let registeredAddr = '';
        const registeredClientSocket = {};
        const updateAddr = (allowUnhooked = false) => {
          const pAddr =  buildAddressFromObj(parent, !allowUnhooked);
          if (pAddr === null && allowUnhooked) {return null; } else {
            const newRAddr  = pAddr + '/' + k.toString();
            const hasChanged = newRAddr !== registeredAddr;

            if (hasChanged) {
             allListeners.delete(registeredAddr);
             registeredAddr = newRAddr;
             allListeners.set(registeredAddr, defaultValue);
           }
            registeredAddr = newRAddr;
            return hasChanged;
         }

       };
        const updateAccessibleAddress = (deferIfUnattached = true, ncb?: () => void) => {

        const result = updateAddr(deferIfUnattached);
        if (result === null && deferIfUnattached) {
          nextTick(() => updateAccessibleAddress(false, ncb));
          return ;
        }
        if (result === null) {
          console.error('can\'t resolve addr on value');
        }
        if (ncb) {ncb(); }
        return result !== null;
      };



        const fetchFunction = (passedCB: (...args: any[]) => any) => {
        updateAccessibleAddress();
        if (clientSocket ) {
          clientSocket.emit(registeredAddr, undefined, passedCB);
        }
      };

        const oldProp = Object.getOwnPropertyDescriptor(parent, k);
        if (oldProp) {debugger; }
        Object.defineProperty(parent, k, {
        get: () => storedValue,
        set: (v: any) => {
          const hasChanged = !_.isEqual(v, storedValue); // for array

          if (hasChanged) {
            storedValue = v;
            const ccb = parent.__remoteCBs[k];
            // debugger
            if (ccb) {ccb(parent, v); }
          }

          const doNotify = () => {
            if (isClient) {
              if (clientSocket ) {
                clientSocket.emit(registeredAddr, v);
              }
            } else {

              broadcastMessageFromServerDebounced(registeredAddr, v);

            }


          };
          updateAccessibleAddress(true, (hasChanged && lockCallbacks === 0) ? doNotify : undefined);
        },

        enumerable: true,
        configurable: true, // needs to be true to handle vue reactivity
      });


        defineObjTable(parent, '__fetch')[k] = fetchFunction;
        defineObjTable(parent, '__accessibleTypes')[k] = type;
        defineObjTable(parent, '__remoteValues')[k] = fetchFunction;
        defineObjTable(parent, '__registerRemoteValuesAddr')[k] = updateAccessibleAddress;
        defineObjTable(parent, '__remoteCBs')[k] = cb;
        return parent[k];
    });

  };
}

export function RemoteFunction(options?: {skipClientApply?: boolean, sharedFunction?: boolean}) {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    let registeredAddr = '';
    defineObjTable(target, '__accessibleTypes')[key] = {
      fType: Reflect.getMetadata('design:type', target, key),
      pTypes: Reflect.getMetadata('design:paramtypes', target, key) || [],
      rType: Reflect.getMetadata('design:returntype', target, key) || {name: 'undefined'},
      get name() {return `(${this.pTypes.map((e: any) => e.name)})=>${this.rType.name}`; },
      // undefined
    };
    const updateAddr = (parent: any, allowUnhooked = false) => {
      const pAddr =  buildAddressFromObj(parent, !allowUnhooked);
      if (pAddr === null && allowUnhooked) {return null; } else {
        const newRAddr  = pAddr + '/' + key.toString();
        const hasChanged = newRAddr !== registeredAddr;
        if (hasChanged) {
         allListeners.delete(registeredAddr);
         registeredAddr = newRAddr;
         allListeners.set(registeredAddr, method);
       }
        registeredAddr = newRAddr;
        return hasChanged;
     }

   };
    const fl = defineObjTable(target, '__registerFunctionAddr')[key] = updateAddr;
    const rf = defineObjTable(target, '__remoteFunctions')[key] = method;
    descriptor.value = function(...args: any[]) { // need plain function for this

    // target.notifyRemote()
    let res: any;
    if (lockCallbacks === 0) {
      // call on remote
      if (clientSocket ) {

        const callF = (allowUnhooked: boolean) => {
          const result =  updateAddr(this, allowUnhooked);
          if (result === null && allowUnhooked) {
            nextTick(() => callF(false));
            return;
          }
          if (result === null) {
            console.error('Remote function can\'t find address');
          }



          if (result === true) {
            // registeredAddr = raddr;
          }

          if (isClient) {
            if ( AccessibleSettedByServer !== registeredAddr  ) {
              // just check if we are not passing complex args as Vue's
              const prunedArgs = args.map((e) => {
                if (typeof(e) === 'object') {
                  const c = Object.assign({}, e);
                  debugger;
                  if (c.__ob__) {
                    debugger;
                    delete c.__ob__;
                  }
                } else {return e; }
              });

              res = sendToSocketDebounced(registeredAddr, args);
            }
          } else {
            broadcastMessageFromServer(registeredAddr, args);
          }
        };

        callF(true);


      } else  {

        console.error('can\'t reach server on RemoteFunction : ', key);
      }
    }

    // call locally
    if (!options || !(isClient && options.skipClientApply) ) {
      // debugger
      if (options && options.sharedFunction) {lockCallbacks += 1; }
      res = method.call(this, ...args);
      if (options && options.sharedFunction) {lockCallbacks -= 1; }
    }


    return res;
  };

};
}



export function nonEnumerable(opts?: {default?: any}) {
  return (target: any, key: string | symbol) => {
    defineOnInstance(target, key, (ob, defaultValue) => {
      const t = defineObjTable(ob, '__nonEnumerables');
      t[key] = true;
      let v = defaultValue;
      Object.defineProperty(ob, key, {
        get: () => v,
        set: (nv) => {v = nv; },
        enumerable: false,
        configurable: false,

      });
      return ob[key];
    });
  };
}

function initAccessibles(parent: any) {
  if (parent.__accessibleMembers) {
    for (const k of Object.keys(parent.__accessibleMembers)) {
      setChildAccessible(parent, k, {immediate: true});
    }
  }
}


const allAccessibleSet = new WeakSet();
const accessibleNameSymbol = Symbol('name');
const accessibleAddressSymbol = Symbol('address');
const isProxySymbol = Symbol('isProxy');

export function setChildAccessible(parent: any, key: string|symbol, opts?: {immediate?: boolean, defaultValue?: any, readonly?: boolean, blockRecursion?: boolean}) {
  const {defaultValue, immediate, readonly, blockRecursion} = opts || {};
  const childAcc = defaultValue !== undefined ? defaultValue : parent[key];

  if (parent.__accessibleMembers && parent.__accessibleMembers[key] ) {
    console.error('re register accessible');
    return; // avoid reregistering
  }
  if (typeof(childAcc) === 'object') {
    Object.defineProperty(childAcc, '__accessibleParent', {
      value: parent,
      enumerable: false,
      configurable: false,
      writable: true,
    });

    Object.defineProperty(childAcc, '__accessibleName', {
      value: key,
      enumerable: false,
      configurable: false,
      writable: true,
    });

    defineObjTable(childAcc, '__accessibleMembers'); //

    const types = defineObjTable(parent, '__accessibleTypes');
    if (types[key] && types[key] !== Reflect.getPrototypeOf(childAcc).constructor) {
      console.error('changing type of accessible');
      debugger;
    }
    types[key] = Reflect.getPrototypeOf(childAcc).constructor;

    const handler = {
      set(obj: any, prop: symbol|string, value: any) {
        if (prop === accessibleNameSymbol || Array.isArray(obj)) {
          // TODO notify nameChange


        }


        const res = true;

        addProp(obj, prop, value);

        const newAcc = obj[prop];
        if (!blockRecursion && typeof(newAcc) === 'object' && prop.toString()[0] !== '_' ) {
          if (!(prop in Object.keys(obj.__accessibleMembers))) {
            console.log(`auto add child Accessible ${prop.toString()} on `, buildAddressFromObj(obj), newAcc);
            allAccessibleSet.add(newAcc);
            setChildAccessible(obj, prop, {immediate: false, defaultValue: value});
          }
        }

        return res;
      },
      get: (target: any, k: symbol|string) => {
        if (k === isProxySymbol) {
          return true;
        } else if (k === accessibleAddressSymbol) {
          return buildAddressFromObj(target);
        }

        return target[k];
      }
      , deleteProperty(target: any, k: symbol|string) {
        if (k in target) { // TODO
          deleteProp(target, k);
          delete target[k];
          console.log(`property removed: ${k.toString()}`);
          return true;
        } else {
          return false;
        }
      },
      /*
       apply:(target, thisArg, argumentsList)=>{
         console.log(`applying method child Accessible ${target}`)
         return Reflect.apply(target, thisArg, argumentsList);
      }
      */
    };
    if (childAcc.__isProxy) {
      debugger;
    }
    const proxy = new Proxy(childAcc, handler);
    Object.defineProperty(parent, key, {
      value: proxy,
      enumerable: true,
      configurable: true,
      writable: !readonly,
    } );
  } else {
    debugger;
  }


  defineObjTable(parent, '__accessibleMembers')[key] = childAcc;
  // parent.__accessibleMembers[k] = parent[k] || parent.__accessibleMembers[k];
  if (immediate) {
    rebuildAccessibles();
  } else {
    rebuildAccessiblesDebounced(); // debounced
  }

  return parent[key];
}




const allAccessibles = new WeakSet<any>();

type Constructable = new (...args: any[]) => any;

function extendClass<T extends Constructable>(BaseClass: T): typeof DerivedClass {
  const DerivedClass = class extends BaseClass {};

  return DerivedClass;
}

export function AccessibleClass() {

  return <T extends Constructable>  (BaseClass: T) => {
    return  new Proxy(BaseClass, {
     construct(target, args) {
      const res = Reflect.construct(target, args);

      if (allAccessibles.has(res)) {
        debugger;
        console.error('recreating accessible');
      }
      allAccessibles.add(res);

      // initAccessibles(this);
      return res;
    },
  });
  };
}


export function fetchRemote(o: any, k: string, cb?: (...args: any[]) => any) {
  if (o.__remoteValues !== undefined && o.__remoteValues[k]) {
    o.__remoteValues[k](cb);
  }
}


export function resolveAccessible(parent: any , addr: string[]) {
  const oriAddr = addr.slice();
  let inspA = addr.shift();
  if (inspA) {

    let insp = parent[inspA];
    let accessibleParent = insp;
    while (insp && addr.length) {
      inspA = addr.shift();
      accessibleParent = insp;
      if (inspA) {insp = insp[inspA]; } else {break; }
    }
    if (addr.length === 0) {
      if (isClient) {
        if (!accessibleParent.__ob__) {
          debugger;
        }
        if (!insp.__ob__) {
         // debugger
       }
     }
      return {accessible: insp, parent: accessibleParent, key: inspA};
   }

 }
  console.error('can\'t find accessible for ', oriAddr, 'stopped at ', addr);
  return {accessible: undefined, parent: undefined};
}
