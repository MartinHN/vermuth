export const isClient = process.env.VUE_APP_ISCLIENT;
const logServerMessages = process.env.LOG_MSG;
let clientSocket: any = null ;
// let ioServer: any = null;
const listenedNodes: {[id: string]: any} = {};
import {addProp, deleteProp, nextTick} from './MemoryUtils';  
let allListeners = new  Map<string, any>();
let AccessibleSettedByServer: any = null;
let AccessibleNotifierId: string|null = null;
let lockCallbacks = 0;
let lockSkipClient = 0
import * as _ from 'lodash';
import { Socket } from 'socket.io';
import 'reflect-metadata';

import {EventEmitter} from 'events';


export const treeEvents = new EventEmitter();



let blockedSocketId: any; // for big updates
export function blockSocket(s: Socket) {
  blockedSocketId = s.id;
}
export function unblockSocket(s: Socket) {
  blockedSocketId = null;
}

export function bindClientSocket(s: any) {

  if (s !== 'auto' && s) { // only on new socke
    const boundSocket = s;
    // if (!isClient) {
      // #if !IS_CLIENT
      const emitF = boundSocket.emit;
      const log = require('./Logger').default;
      console.log('highjacking server socket');
      const nF = (e: string, a: any, l: any) => {
        if (logServerMessages) {
          if (e === 'SET_STATE') {a = ''; }
          log.log('server >> all clients : ' + e + ' : ' + a + '\n');
        }
        emitF.apply(boundSocket, [e, a, l]);
      };

      boundSocket.emit = nF;
    // } else {
      // #else
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
     // #endif
   // }

 }
 safeBindSocket(s);


}


let   msgToSocketQueue: any = {};

const updateMsgToSocketQueue = _.debounce(() => {

  for (const addr of Object.keys(msgToSocketQueue)) {
    const q = msgToSocketQueue[addr];
    clientSocket.emit(addr, q.msg);
  }
  msgToSocketQueue = {};
}, 10, {trailing: true, maxWait: 30});

const sendToSocketDebounced = (addr: string, args: any) => {msgToSocketQueue[addr] = {msg: args, sid: AccessibleNotifierId}; updateMsgToSocketQueue(); };



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
    if (o && o.__accessibleMembers) {
      for ( const name of Object.keys(o.__accessibleMembers)) {
        const last = curNode;
        curNode [name] = {type: o.__accessibleTypes[name]};
        curNode = curNode [name];
        recurseAccessible(o.__accessibleMembers[name]);
        curNode = last;
      }
    }
    // debugger
    curNode.__ob = o;
    if (o && o.__registerRemoteValuesAddr) {
      curNode[valSymbol] = [];
      for (const l of Object.keys( o.__registerRemoteValuesAddr)) {
        curNode[valSymbol].push({v: l, type: o.__accessibleTypes[l].name});
        o.__registerRemoteValuesAddr[l]();
      }
    }
    if (o && o.__registerFunctionAddr) {
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
            if (key === 'fixtureDefs') {
              debugger;
            }
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
  let addr = new Array<string>();
  let found;
  while (insp && !insp.__isRoot) {
    found = false;
    if (insp.__accessibleName) {
      addr.push(insp.__accessibleName);
      found = true;
    } else if (Array.isArray(insp.__accessibleParent)) {
      let idx = 'null';
      for (const [k, v] of Object.entries(insp.__accessibleParent.__accessibleMembers)) {
        if (v === insp) {
          idx = k;
        }
      }
      if (idx === 'null') {debugger; console.error('not found parent accessible in array'); }
      addr.push('' + idx);
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
        'can\'t find address on object' + JSON.stringify(o));
    }
    return null;
  }

}


let   msgQueue: any = {};

const updateQueue = _.debounce(() => {

  for (const addr of Object.keys(msgQueue)) {
    const msg = msgQueue[addr];
    broadcastMessageFromServer(addr, msg.args, msg.sid);

  }
  msgQueue = {};
}, 50, {trailing: true, maxWait: 100});
const broadcastMessageFromServerDebounced = (addr: string, args: any) => {msgQueue[addr] = {args, sid: AccessibleNotifierId}; updateQueue(); };

function broadcastMessageFromServer(addr: string, args: any, sid?: string) {
  // let log;
  if (!addr) {
    debugger;
  } else {
    // if (logServerMessages) {log = require('./Logger').default; }
    if (!isClient && clientSocket && clientSocket.sockets) {
      // broadcast to other clients if we are server
      for (const s of Object.values(clientSocket.sockets.sockets)) {
        const sock = (s as Socket);
        if (sock.id !== blockedSocketId &&
         ((addr !== AccessibleSettedByServer )
          || ((sock.id !== (sid || AccessibleNotifierId) ) ))
         ) {

          sock.emit(addr, args);

      } else {
        console.log('avoid feedback on', addr);
      }
    }
  }

  // console.warn("avoid feedback");
}
}




function defineObjTable(obj: any, tableName: string) {
  if (!obj[tableName]) {
    Reflect.defineProperty(obj, tableName, {
      value: {},
      enumerable: false,
      configurable: false,
      writable: true,
    } );
  }

  return obj[tableName];
}

const reenterLock = false;
function defineOnInstance(targetClass: any, key: string | symbol, onInstance: (o: any, defaultV: any) => any) {

  const trapDepth = 0;
  let value: any;
  const allInstances = new WeakSet<any>();
  function checkIntegrity(parent: any) {
    // if(!reenterLock){return}
    if (allInstances.has(parent)) {
      debugger;
    }
    allInstances.add(parent);

  }

  function clearTrap(ob: any) {
    const {enumerable: wasEnumerable} = Reflect.getOwnPropertyDescriptor(ob, key) || {enumerable: true};
    Reflect.defineProperty(ob, key, {
      value,
      enumerable: wasEnumerable,
      configurable: true,
      writable: true,
    } );
  }
  function getter(this: any) {
    clearTrap(this);
    value = onInstance(this, null);
    checkIntegrity(this);
    return value;
  }
  function setter(this: any, nv: any) {
    clearTrap(this);
    value = onInstance(this, nv);
    checkIntegrity(this);
  }


  Reflect.defineProperty(targetClass, key, {
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

      // const oldProp = Object.getOwnPropertyDescriptor(parent, k);
      // if (oldProp) {debugger; }
      Reflect.defineProperty(parent, k, {
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
            if (!k.toString().startsWith('_')) {
              treeEvents.emit('v', parent, k);
            }
            if (isClient) {
              if (clientSocket ) {
                clientSocket.emit(registeredAddr, v);
              }
            } else {

              broadcastMessageFromServerDebounced(registeredAddr, v);

            }


          };
          const isSetByServer = AccessibleSettedByServer !== null && registeredAddr === AccessibleSettedByServer;

          updateAccessibleAddress(true, (hasChanged && lockCallbacks === 0 && !isSetByServer) ? doNotify : undefined);
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

          // just check if we are not passing complex args as Vue's

          const prunedArgs = args.map((e) => {
            if (typeof(e) === 'object' && e !== null) {
              const addr = buildAddressFromObj(e, false);
              if (addr) {console.log('setting addr as arg'); return '/?' + addr; }
              if (e.__ob__) {

                const c = Object.assign({}, e);
                delete c.__ob__;
                return c;
              }
            }
            return e;
          });
          if (isClient) {

            if ( AccessibleSettedByServer !== registeredAddr  ) {
              res = sendToSocketDebounced(registeredAddr, prunedArgs);
            }
          } else {
            broadcastMessageFromServer(registeredAddr, prunedArgs);
          }
        };

        callF(true);


      } else  {

        console.error('can\'t reach server on RemoteFunction : ', key);
      }
    }

    // call locally
    if(options && options.skipClientApply){lockSkipClient+=1 ;}// if(lockCallbacks>0){debugger}}

    if (!options || !(isClient && options.skipClientApply) ) {
      // debugger
      if (options && options.sharedFunction) {lockCallbacks += 1; }//if(lockSkipClient>0){debugger}}

      if (args ) {
        const rS = require('./RootState').default;
        args = args.map((e) => {
          if (typeof(e) === 'string' && e.startsWith('/?')) {

            const saddr = e.substring(2);
            const addr = saddr.split('/');
            if (addr.length && addr[0] === '') {addr.shift(); }
            const {accessible, parent, key: acc_key}  = resolveAccessible(rS, addr);
            if (accessible === undefined) {
              debugger;
              console.log('failed to resolve addr', addr);
              return e;
            }
            return accessible;
          }
          return e;
        },
        );
      }
      res = method.call(this, ...args);
      treeEvents.emit('call', this, options, {isFromShared: lockCallbacks > 0});
      if (options && options.sharedFunction) {lockCallbacks -= 1; }
      if(options && options.skipClientApply){lockSkipClient-=1}
    }


  return res;
};

};
}

export function  callOnServerOnly(cb: () => void) {
  if (!isClient) {
    cb();
  }
}

export function isClientInstance() {
  return isClient;
}
export function nonEnumerable(opts?: {default?: any}) {
  return (target: any, key: string | symbol) => {
    defineOnInstance(target, key, (ob, defaultValue) => {
      const t = defineObjTable(ob, '__nonEnumerables');
      t[key] = true;
      let v = defaultValue;
      Reflect.defineProperty(ob, key, {
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


let rootAccessible;
export function setRoot(o: any) {
  rootAccessible  = o;
}

function isChildOfRoot(o: any) {
  // if(!rootAccessible){   console.error('no root attached') }
  let insp = o;
  let maxDepth = 1000;

  while (insp) {
    maxDepth--;
    if (insp.__isRoot) {return true; }
    insp = insp.__accessibleParent;
  }
  return false;
}

const allAccessibleSet = new WeakSet();
const accessibleNameSymbol = Symbol('name');
const accessibleAddressSymbol = Symbol('address');
const isProxySymbol = Symbol('isProxy');
let reentrancyLock = false;

export function setChildAccessible(parent: any, key: string|symbol, opts?: {immediate?: boolean, defaultValue?: any, readonly?: boolean, blockRecursion?: boolean}) {
  if (reentrancyLock) {
    return parent[key];
  }
  if (key === '-1') {
    debugger;
  }
  const {defaultValue, immediate, readonly, blockRecursion} = opts || {};
  let childAcc = defaultValue !== undefined ? defaultValue : parent[key];
  // debugger

  if (parent.__accessibleMembers && parent.__accessibleMembers[key] ) {
    debugger;
    console.error('re register accessible');
    return; // avoid reregistering
  }
  if (typeof(childAcc) === 'object' && childAcc !== null) {
    allAccessibleSet.add(childAcc);
    Reflect.defineProperty(childAcc, '__accessibleParent', {
      value: parent,
      enumerable: false,
      configurable: false,
      writable: true,
    });

    Reflect.defineProperty(childAcc, '__accessibleName', {
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
      set(obj: any, prop: symbol|string, value: any, thisProxy: any) {



        const res = Reflect.set(obj, prop, value, thisProxy);


        // const res = true;
        if (prop === accessibleNameSymbol ) {
          // TODO notify nameChange

        }
        const isHiddenMember = prop.toString()[0] === '_' || !obj.propertyIsEnumerable(prop);


        const newAcc = obj[prop];

        if (!blockRecursion && typeof(newAcc) === 'object' && !isHiddenMember) {
          if (typeof(prop) === 'string') {
            if (!Object.keys(obj.__accessibleMembers).includes(prop)) {
              console.log(`auto add child Accessible ${prop.toString()} on `, buildAddressFromObj(obj)); // newAcc, Object.keys(obj.__accessibleMembers));
              setChildAccessible(obj, prop, {immediate: false, defaultValue: value});
            }
          }
        }

        return res;
      }
      ,
      get: (target: any, k: symbol|string, thisProxy: any) => {
        if (k === isProxySymbol) {
          return true;
        } else if (k === accessibleAddressSymbol) {
          return buildAddressFromObj(target);
        } else if ((target instanceof Map  || target instanceof Set) && typeof((target as any)[k]) === 'function') {
          return (target as any)[k].bind(target);
        }

        return Reflect.get(target, k, thisProxy);
      }
      , deleteProperty(target: any, k: symbol|string) {

        if (k in target) { // TODO lockCallbacks? for deleted objects?
          treeEvents.emit('rm', target, k);
          delete target.__accessibleMembers[k];
          delete target.__accessibleTypes[k];

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
    if (!childAcc[isProxySymbol]) {
      // recurse on initial values
      for (const [k, v] of Object.entries(childAcc)) {
        // @ts-ignore
        if (typeof(v) === 'object' && (v === null || !v[isProxySymbol])) {
          handler.set(childAcc, k, v, undefined);
        }
      }
      childAcc = new Proxy(childAcc, handler);

    } else {

      debugger;
      console.error('reproxying!!!');

    }
    // const hadProp = parent.hasOwnProperty(key);

    
    reentrancyLock = true;


    // hack for vue to generate reactive data
    addProp(new Proxy(parent, {
      has(target: any, k: string|symbol) {
        if (k === 'externalController') {
          debugger;
        }
        if (reentrancyLock && k === key) {return false; }
        return  Reflect.has(target, key);
      }}), key, childAcc);
    reentrancyLock = false;
    const desc = Reflect.getOwnPropertyDescriptor(parent, key) || {value: childAcc, configurable: false};

    if (desc.set) {
      if (readonly) {
        const oldSetter = desc.set;
        desc.set = (v) => {
          debugger;
          console.error('trying to set readonly');
          oldSetter(v);
        };
      }
    } else {
      desc.writable = !readonly;
    }
    Reflect.defineProperty(parent, key, desc);
    if (!isChildOfRoot(parent)) {
      console.log('avoiding notifying tree change unattached child ', key);
    } else if (key.toString().startsWith('_')) {
      console.log('avoiding notifying tree change of private child ', key);
    } else {

      treeEvents.emit('add', parent, key);
    }

    
    // reentrancyLock = true
    // parent[key] = childAcc
    // reentrancyLock = false



  } else if (childAcc !== null) {
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

// type Constructable = new (...args: any[]) => any;

// function extendClass<T extends Constructable>(BaseClass: T): typeof DerivedClass {
//   const DerivedClass = class extends BaseClass {};

//   return DerivedClass;
// }

// export function AccessibleClass() {

//   return <T extends Constructable>  (BaseClass: T) => {
//     return  new Proxy(BaseClass, {
//       construct(target, args) {
//         const res = Reflect.construct(target, args);

//         if (allAccessibles.has(res)) {
//           debugger;
//           console.error('recreating accessible');
//         }
//         allAccessibles.add(res);

//         // initAccessibles(this);
//         return res;
//       },
//     });
//   };
// }
export function AccessibleClass(){
  return (constructor:Function)=>{}

}


export function doSharedFunction(cb: () => void) {
  lockCallbacks += 1;
  cb();
  lockCallbacks -= 1;
}
export function fetchRemote(o: any, k: string, cb?: (...args: any[]) => any) {
  if (o.__remoteValues !== undefined && o.__remoteValues[k]) {
    o.__remoteValues[k](cb);
  }
}


export function resolveAccessible(parent: any , addr: string[]) {
  const oriAddr = addr.slice();
  addr = addr.slice(); // copy
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
 debugger;
 console.error('can\'t find accessible for ', oriAddr, 'stopped at ', addr);
 return {accessible: undefined, parent: undefined};
}
