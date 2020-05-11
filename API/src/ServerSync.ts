export const isClient = process.env.VUE_APP_ISCLIENT;
import dbg from './dbg'
const dbgTree = dbg('TREE')
const dbgMsg = dbg('MSG')
const dbgStruct = dbg('STRUCT')
const logServerMessages = process.env.LOG_MSG;

let clientSocket: any = null;
// let ioServer: any = null;
const listenedNodes: { [id: string]: any } = {};
import { addProp, deleteProp, nextTick, isProxyfiable } from './MemoryUtils';
let allListeners = new Map<string, any>();
let AccessibleSettedByServer: any = null;
let AccessibleNotifierId: string | null = null;
let lockCallbacks = 0;
let lockSkipClient = 0;
import { isEqual, debounce } from 'lodash';
import { Socket } from 'socket.io';
import 'reflect-metadata';

import RootStateI from './RootState';

import { EventEmitter } from 'events';


function assert(v: boolean, ...msg: any[]) {
  if (!v) {
    console.error(msg);
    debugger
  }
  return v
}

class TreeEventClass extends EventEmitter {
  static emittedEvents = ["v", "call", "move", "rm", "add"]
  onAll(f: any) {
    for (const e of TreeEventClass.emittedEvents) {
      this.on(e, (...args) => f(e, ...args))
    }
  }
}
export const treeEvents = new TreeEventClass();

if (dbgTree.enabled) {

  treeEvents.on('v', (parent: any, key: string) => {
    dbgTree('>>> v', key)
  });
  treeEvents.on('move', (parent: any, key: string, toKey: string) => {
    dbgTree('>>> move', key)
  });
  treeEvents.on('add', (parent: any, key: string) => {
    dbgTree('>>> add', key)
  });
  treeEvents.on('rm', (parent: any, key: string) => {
    dbgTree('>>> rm', key)
  });

  treeEvents.on('call', (parent: any, options: any, ctx: any) => {
    // dbgTree('>>> call',parent)
  });
}

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
    dbgMsg('highjacking server socket');
    const nF = (e: string, a: any, l: any) => {
      if (logServerMessages) {
        if (e === 'SET_STATE') { a = ''; }
        dbgMsg('server >> all clients : ' + e + ' : ' + a + '\n');
      }
      emitF.apply(boundSocket, [e, a, l]);
    };

    boundSocket.emit = nF;
    // } else {
    // #else
    const onevent = boundSocket.onevent;
    const oriEmitF = boundSocket.emit

    boundSocket.emit = (e: any, a: any, l: any) => {
      if (!e) {
        debugger;
      }
      dbgMsg('client >> server : ' + e + ' : ' + a + '\n');
      oriEmitF.apply(boundSocket, [e, a, l]);
    }
    if (!boundSocket.__eventOverriden) {
      boundSocket.__eventOverriden = true;
      boundSocket.onevent = (packet: any) => {
        const args = (packet.data || []).slice();
        const rS = getRoot();
        const addr = args.shift();
        if (addr && (addr[0] === '/')) {
          callAnyAccessibleFromRemote(rS, addr, args[0], boundSocket.id);
        } else {

          onevent.call(boundSocket, packet);    // original call
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


// let msgToSocketQueue: { [id: string]: any[] } = {};

// const updateMsgToSocketQueue = debounce(() => {

//   for (const addr of Object.keys(msgToSocketQueue)) {
//     const q = msgToSocketQueue[addr];
//     q.map(qe => clientSocket.emit(addr, qe.msg))
//   }
//   msgToSocketQueue = {};
// }, 10, { trailing: true, maxWait: 30 });

// const sendToSocketDebounced = (addr: string, args: any) => {
//   const params = { msg: args, sid: AccessibleNotifierId };
//   const existing = msgToSocketQueue[addr]
//   if (existing && isEqual(params, existing)) {
//     msgToSocketQueue[addr].push(params)
//   }
//   else {
//     msgToSocketQueue[addr] = [{ msg: args, sid: AccessibleNotifierId }];
//   }
//   updateMsgToSocketQueue();
// };



class MessageQueue<T>{
  public notifyFlush: () => void;
  constructor(private cb: (addr: string, msg: T, id?: string) => void,
    public canCollapse: boolean,
    time: number,
    maxWait?: number) {

    this.notifyFlush = debounce(this.flush.bind(this)
      , time//50
      , { trailing: true, maxWait: maxWait === undefined ? 50 : maxWait })

  }

  public queue: { [id: string]: { msg: T; notifierId: string | null }[] } = {};

  public push(addr: string, args: T, collapse?: boolean) {
    const canCollapse = collapse === undefined ? this.canCollapse : collapse;
    const params = { msg: args, notifierId: AccessibleNotifierId };
    const hadMessages = this.queue[addr] //&& this.queue[addr].length
    if (!canCollapse && hadMessages) {
      this.queue[addr].push(params)
    }
    else {
      if (hadMessages) {
        if (!addr.endsWith('_time')) {
          dbgMsg(`overriding msg ${addr} from ${this.queue[addr][0].msg} to ${params.msg}`)
        }
      }
      this.queue[addr] = [params]

    }

    // else {
    //   const existingIdx = this.queue[addr].findIndex(m => isEqual(m.msg, params.msg))
    //   if (existingIdx < 0) {
    //     this.queue[addr].push(params)
    //   }
    //   else {
    //     if (!addr.endsWith('_time')) dbgMsg(`overriding msg ${addr} from ${this.queue[addr][existingIdx].msg} to ${params.msg}`)
    //     this.queue[addr][existingIdx] = params
    //   }
    // }
    this.notifyFlush();
    // this.flush()
  }


  public flush() {

    const old = { AccessibleSettedByServer, AccessibleNotifierId }
    AccessibleSettedByServer = undefined;
    AccessibleNotifierId = null;
    // if (AccessibleSettedByServer || AccessibleNotifierId) {
    //   assert(false,'weiiiiiird', AccessibleSettedByServer, AccessibleNotifierId)

    // }
    for (const addr of Object.keys(this.queue)) {
      const msgL = this.queue[addr];
      msgL.map(m => {
        AccessibleNotifierId = m.notifierId
        this.cb(addr, m.msg, m.notifierId !== null ? m.notifierId : undefined)
      })
      //broadcastMessageFromServer(addr, msg.args, msg.sid);
    }
    // dbgMsg("flushed")
    AccessibleSettedByServer = old.AccessibleSettedByServer;
    AccessibleNotifierId = old.AccessibleNotifierId;
    this.queue = {};

  }
}

const clientToServerQueue = new MessageQueue((addr, args, sid) => {
  if (clientSocket) {
    clientSocket.compress(false).binary(false).emit(addr, args)
  }
}, false, 10, 10)


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
          ((addr !== AccessibleSettedByServer)
            && (sock.id !== (sid || AccessibleNotifierId)))
        ) {

          sock.emit(addr, args);

        } else {
          //dbgMsg('avoid feedback on', addr);
        }
      }
    }

    // console.warn("avoid feedback");
  }
}

const serverToClientsQueue = new MessageQueue(broadcastMessageFromServer, false, 30, 30); // 50 ,100




const getFunctionParams = (func: (...args: any[]) => any) => {
  const ARGUMENT_NAMES = /([^\s,]+)/g;
  const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (result === null) { return []; }
  return result;

};





export const rebuildChildAccessibles = (fromParent?: any, buildTypeTree = true,rebuild = true) => {
  const valSymbol = Symbol('values');
  const funSymbol = Symbol('functions');


  allListeners = new Map();
  const accessibleTree: any = {};
  let curNode = accessibleTree;
  const rS = fromParent || getRoot();

  const recurseAccessible = (o: any) => {
    if (!assert(o !== undefined, 'accessible parsing error')) { return }

    if (o && o.__accessibleMembers) {
      for (const name of Object.keys(o.__accessibleMembers)) {
        const last = curNode;
        curNode[name] = { type: o.__accessibleTypes[name] };
        curNode = curNode[name];
        recurseAccessible(o.__accessibleMembers[name]);
        curNode = last;
      }
    }
    // debugger
    if (buildTypeTree) { curNode.__ob = o; }
    if (o && o.__registerRemoteValuesAddr) {
      if (buildTypeTree) {
        curNode[valSymbol] = [];
        for (const l of Object.keys(o.__registerRemoteValuesAddr)) {
          curNode[valSymbol].push({ v: l, type: o.__accessibleTypes[l].name });
        }
      }
      if(rebuild){
      for (const l of Object.keys(o.__registerRemoteValuesAddr)) {
        o.__registerRemoteValuesAddr[l]();
      }
    }
    }
    if (o && o.__registerFunctionAddr) {
      if (buildTypeTree) {
        curNode[funSymbol] = [];
        for (const [l, f] of Object.entries(o.__registerFunctionAddr)) {
          curNode[funSymbol].push({ v: l, f, params: getFunctionParams(f as (...args: any[]) => any), type: o.__accessibleTypes[l].name });
        }
      }
      if(rebuild){
      for (const [l, f] of Object.entries(o.__registerFunctionAddr)) {
        o.__registerFunctionAddr[l](o);
      }
    }
    }

  };
  recurseAccessible(rS);
  dbgStruct('updated addr', rS.__isRoot ? "root" : rS?.__accessibleName, accessibleTree); // Array.from(allListeners.keys()));
  if(buildTypeTree){
    return accessibleTree
  }
};

const rebuildChildAccessiblesDebounced = debounce(rebuildChildAccessibles,
  200,
  { trailing: true },
);






export function callAnyAccessibleFromRemote(root: any, saddr: string, args: any[], notifierId: string) {// args is passed as array
  if (!assert(root, 'root not set, can\'t call')) { return; }
  if (saddr[0] === '/') {
    const addr = saddr.split('/');

    if (addr.length && addr[0] === '') { addr.shift(); }


    const { accessible, parent, key } = resolveAccessible(root, addr);

    if (accessible !== undefined) {
      if (AccessibleSettedByServer === addr) {
        console.warn('avoid feedback');
        return;
      }
      if (typeof (accessible) === 'function') { // call method

        AccessibleNotifierId = notifierId;
        AccessibleSettedByServer = saddr;
        const res = accessible.call(parent, ...args);
        AccessibleNotifierId = null;
        AccessibleSettedByServer = null;
        return res;

      } else if ((args !== undefined && args !== null)) { // set value
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
  if (clientSocket !== null && s !== 'auto') { console.error('reassigning socket'); }
  if (s !== 'auto') { clientSocket = s; }
  // rebuildAccessibles();

}

export function buildAddressFromObj(o: any, errorIfEmpty = true) {
  let insp = o;
  let addr = new Array<string>();
  let found;
  let maxDepth = 100;
  while (insp && !insp.__isRoot && (maxDepth--) > 0) {
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
      if (idx === 'null') { assert(false, 'not found parent accessible in array'); }
      addr.push('' + idx);
      found = true;
    } else if (insp.__accessibleParent) {
      console.warn('manual looking in parent')
      const pair = Object.entries(insp.__accessibleParent).find(([k, v]) => v === insp);
      if (pair) {
        addr.push(pair[0]);
        found = true;
      } else {
        assert(false, 'not found');
      }

    }

    insp = insp.__accessibleParent;
  }
  if (maxDepth < 1) {
    assert(false, 'recursive tree');
    return null;
  }
  if (addr && addr.length) {
    addr = addr.reverse();
    return '/' + addr.join('/');
  } else if (insp && insp.__isRoot) {
    return '';
  } else {
    if (errorIfEmpty) {
      assert(false, 'can\'t find address on object' + JSON.stringify(o));
    }
    return null;
  }

}


function defineObjTable(obj: any, tableName: string) {
  if (!obj[tableName]) {
    Reflect.defineProperty(obj, tableName, {
      value: {},
      enumerable: false,
      configurable: false,
      writable: true,
    });
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
    const { enumerable: wasEnumerable } = Reflect.getOwnPropertyDescriptor(ob, key) || { enumerable: true };
    Reflect.defineProperty(ob, key, {
      value,
      enumerable: wasEnumerable,
      configurable: true,
      writable: true,
    });
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

  });




}


export function SetAccessible(opts?: { readonly?: boolean; blockRecursion?: boolean }) {
  const readonly = opts && opts.readonly;
  const blockRecursion = opts && opts.blockRecursion;
  return (target: any, key: string | symbol) => {
    defineOnInstance(target, key, (parent: any, defaultValue: any) => {
      return setChildAccessible(parent, key, { immediate: false, defaultValue, readonly, blockRecursion });
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
          const pAddr = buildAddressFromObj(parent, !allowUnhooked);
          if (pAddr === null && allowUnhooked) { return null; } else {
            const newRAddr = pAddr + '/' + k.toString();
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
          if (!parent && !deferIfUnattached) {
            console.error('unattached child')
            debugger
          }
          if (parent && ((parent as any).__isConstructed === false)) {
            return false;
          }
          const result = updateAddr(deferIfUnattached);
          if (result === null && deferIfUnattached) {
            nextTick(() => updateAccessibleAddress(false, ncb));
            return;
          }
          if (result === null) {
            console.error('can\'t resolve addr on value');
          }
          if (ncb) { ncb(); }
          return result;
        };



        const fetchFunction = (passedCB: (...args: any[]) => any) => {
          updateAccessibleAddress();
          if (clientSocket) {
            clientSocket.emit(registeredAddr, undefined, passedCB);
          }
        };

        // const oldProp = Object.getOwnPropertyDescriptor(parent, k);
        // if (oldProp) {debugger; }
        Reflect.defineProperty(parent, k, {
          get: () => storedValue,
          set: (v: any) => {
            const hasChanged = !isEqual(v, storedValue); // for array

            if (hasChanged) {
              storedValue = v;
              const ccb = parent.__remoteCBs[k];
              // debugger
              if (ccb) { ccb(parent, v); }

            }

            const doNotify = () => {
              if (!k.toString().startsWith('_')) {
                treeEvents.emit('v', parent, k);
              }
              if (isClient) {
                if (clientSocket) {
                  clientToServerQueue.push(registeredAddr, v, true);
                }
              } else {
                serverToClientsQueue.push(registeredAddr, v, true)
                //broadcastMessageFromServerDebounced(registeredAddr, v);

              }


            };
            const isSetByServer = AccessibleSettedByServer !== null && registeredAddr === AccessibleSettedByServer;

            //updateAccessibleAddress(true, (hasChanged && lockCallbacks === 0 && !isSetByServer) ? doNotify : undefined);
            if (hasChanged && lockCallbacks === 0 && (!isClient || !isSetByServer) &&
              parent && ((parent as any).__isConstructed !== false)) {
              if (!registeredAddr) {
                updateAccessibleAddress(false)
              }
              if (updateAccessibleAddress(false) !== false) { // if registred adress has changed , thus not in sync
                debugger
              }
              doNotify()
            }
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



export function RemoteFunction(options?: { skipClientApply?: boolean; sharedFunction?: boolean }) {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    let registeredAddr = '';
    defineObjTable(target, '__accessibleTypes')[key] = {
      fType: Reflect.getMetadata('design:type', target, key),
      pTypes: Reflect.getMetadata('design:paramtypes', target, key) || [],
      rType: Reflect.getMetadata('design:returntype', target, key) || { name: 'undefined' },
      get name() { return `(${this.pTypes.map((e: any) => e.name)})=>${this.rType.name}`; },
      // undefined
    };
    const updateAddr = (parent: any, allowUnhooked = false) => {
      if (parent && ((parent as any).__isConstructed === false)) {
        return false;
      }
      const pAddr = buildAddressFromObj(parent, !allowUnhooked);
      if (pAddr === null && allowUnhooked) { return null; } else {
        const newRAddr = pAddr + '/' + key.toString();
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
    descriptor.value = function (...args: any[]) { // need plain function for this

      // target.notifyRemote()
      let res: any;
      if (lockCallbacks === 0 && (this as any).__isConstructed !== false) {
        // call on remote
        if (clientSocket) {

          const notifyF = (allowUnhooked: boolean) => {
            const result = updateAddr(this, allowUnhooked);
            if (result === null && allowUnhooked) {
              nextTick(() => notifyF(false));
              return;
            }
            if (result === null) {
              console.error('Remote function can\'t find address');
            }



            if (result === true) {
              // registeredAddr = raddr;
            }

            // just check if we are not passing complex args as Vue's
            const pruneArg = (e: any): any => {
              if (Array.isArray(e)) {
                return e.map(pruneArg);
              } else if (typeof (e) === 'object' && e !== null) {
                const addr = buildAddressFromObj(e, false);
                if (addr) { dbgMsg('setting addr as arg'); return '/?' + addr; }
                if (e.__ob__) {
                  const c = Object.assign({}, e);
                  delete c.__ob__;
                  return c;
                } else {
                  return e
                }
              } else {
                return e;
              }
            };
            const prunedArgs = pruneArg(args);

            if (isClient) {

              if (AccessibleSettedByServer !== registeredAddr) {
                // res = sendToSocketDebounced(registeredAddr, prunedArgs);
                clientToServerQueue.push(registeredAddr, prunedArgs, true)
              }
            } else {
              serverToClientsQueue.push(registeredAddr, prunedArgs, true)
              // broadcastMessageFromServer(registeredAddr, prunedArgs);
            }
          };

          notifyF(true);


        } else {

          console.error('can\'t reach server on RemoteFunction : ', key);
        }
      }

      // call locally
      if (options && options.skipClientApply) { lockSkipClient += 1; }// if(lockCallbacks>0){debugger}}

      if (!options || !(isClient && options.skipClientApply)) {
        // debugger
        if (options && options.sharedFunction) { lockCallbacks += 1; }// if(lockSkipClient>0){debugger}}

        if (args) {


          args = args.map((e) => {
            if (typeof (e) === 'string' && e.startsWith('/?')) {
              if (!getRoot(target)) {
                console.error('root not linked');
                debugger;
                return;
              }
              const saddr = e.substring(2);
              const addr = saddr.split('/');
              if (addr.length && addr[0] === '') { addr.shift(); }
              const { accessible, parent, key: acc_key } = resolveAccessible(rootAccessible, addr);
              if (accessible === undefined) {
                debugger;
                dbgStruct('failed to resolve addr', addr);
                return e;
              }
              return accessible;
            }
            return e;
          },
          );
        }
        res = method.call(this, ...args);
        treeEvents.emit('call', this, options, { isFromShared: lockCallbacks > 0 });
        if (options && options.sharedFunction) { lockCallbacks -= 1; }
        if (options && options.skipClientApply) { lockSkipClient -= 1; }
      }


      return res;
    };

  };
}

export function callOnServerOnly(cb: () => void) {
  if (!isClient) {
    cb();
  }
}

export function isClientInstance() {
  return isClient;
}
export function nonEnumerable(opts?: { default?: any }) {
  return (target: any, key: string | symbol) => {
    defineOnInstance(target, key, (ob, defaultValue) => {
      const t = defineObjTable(ob, '__nonEnumerables');
      t[key] = true;
      let v = defaultValue;
      Reflect.defineProperty(ob, key, {
        get: () => v,
        set: (nv) => { v = nv; },
        enumerable: false,
        configurable: false,

      });
      return ob[key];
    });
  };
}


export function ClientOnly() {
  
  if (!isClient) {
    return (target: any, key: string | symbol) => {
      defineOnInstance(target, key, (ob, defaultValue) => {
        const t = defineObjTable(ob, '__nonEnumerables');
        t[key] = true;
        let v = defaultValue;
        Reflect.defineProperty(ob, key, {
          get: () => {
            dbg.warn('getting server instance of client only :', key,v);
            return v;
          }
          , set: (nv) => {
            dbg.warn('setting server instance of client only :', key)
            // v = nv; // ensure value is not changed on server...
          },
          enumerable: false,
          configurable: false,
        });
        return v;
      });
    };
  }else{
    return ()=>{}
  }
}

// function initAccessibles(parent: any) {
//   if (parent.__accessibleMembers) {
//     for (const k of Object.keys(parent.__accessibleMembers)) {
//       setChildAccessible(parent, k, { immediate: true });
//     }
//   }
// }


let rootAccessible: any = require('./RootState'); // importing here means we need to take care at importing it first in other modules
function getRoot(hint?: any) {
  // circlar Refs forces dynamic import, (legacy)
  // if (rootAccessible === undefined) {
  //   import('./RootState').then((e: any) => { rootAccessible = e.default; dbgStruct('loadedRoot', e); });

  //   rootAccessible = null;
  // } else
  if (rootAccessible && rootAccessible.__esModule) { // once require loop ended rootAccessible is the default export
    rootAccessible = rootAccessible.default
  }

  return rootAccessible;

}

function findRoot(o: any) {
  let insp = o;
  let maxDepth = 1000;

  while (insp) {
    maxDepth--;
    if (insp.__isRoot) { return insp; }
    insp = insp.__accessibleParent;
  }

}
function isChildOfRoot(o: any) {
  // if(!rootAccessible){   console.error('no root attached') }
  let insp = o;
  let maxDepth = 1000;

  while (insp) {
    maxDepth--;
    if (insp.__isRoot) { return true; }
    insp = insp.__accessibleParent;
  }
  return false;
}

const allAccessibleSet = new WeakSet();
const accessibleNameSymbol = Symbol('name');
const accessibleAddressSymbol = Symbol('address');
const setContextSymbol = Symbol('context');
export const isProxySymbol = Symbol('isProxy');
let reentrancyLock = false;

export function setChildAccessible(parent: any, key: string | symbol, opts?: { immediate?: boolean; defaultValue?: any; readonly?: boolean; blockRecursion?: boolean }) {
  if (reentrancyLock) {
    return parent[key];
  }
  if (key === '-1') {
    debugger;
  }
  const { defaultValue, immediate, readonly, blockRecursion } = opts || {};
  let childAcc = defaultValue !== undefined ? defaultValue : parent[key];
  // debugger
  if (parent.__remoteValues && parent.__remoteValues[key]) {
    console.warn('ignoring remote value as child accessible')
    return
  }

  if (parent.__accessibleMembers && parent.__accessibleMembers[key]) {
    //debugger;
    console.warn('re register child accessible', key);
    if (parent.__accessibleMembers[key].__accessibleName) { // remove old value
      parent.__accessibleMembers[key].__accessibleName = undefined
    }
    delete parent.__accessibleMembers[key]
    // return; // avoid reregistering
  }

  if (typeof (childAcc) === 'object' && childAcc !== null) {
    allAccessibleSet.add(childAcc);
    if (childAcc.__accessibleParent && childAcc.__accessibleParent !== parent) {
      console.error(key, 'overriding parent', childAcc.__accessibleParent, ' with ', parent);
      debugger
    }
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
    if (key === 'parentGroup') {

      debugger;
    }
    defineObjTable(childAcc, '__accessibleMembers'); //

    const types = defineObjTable(parent, '__accessibleTypes');

    let curType = Reflect.getPrototypeOf(childAcc)
    if(curType?.constructor?.name==="AClass"){ // ignore Accessible Class
      curType = Reflect.getPrototypeOf(curType)
    }
    if (types[key] && types[key] !== curType.constructor) {
      console.error('changing type of accessible');
      debugger;
    }
    types[key] = curType.constructor;

    const handler = {
      set(obj: any, prop: symbol | string, value: any, thisProxy: any) {
        let needRebuild = false;
        if (Array.isArray(obj) && !isNaN(prop as any)) {
          if (value && value.__accessibleName !== undefined) {
            if (obj && obj === value.__accessibleParent) {
              if ((obj as any).__accessibleMembers &&
                Object.keys((obj as any).__accessibleMembers).includes(value.__accessibleName)) {
                if ((obj as any).__accessibleMembers[prop] === value) {
                  console.warn('double array assign');
                  debugger;
                }
                else {
                  // rename
                  const siblings = (obj as any).__accessibleMembers
                  if (siblings && siblings[prop] && siblings[prop].__accessibleName) {
                    siblings[prop].__accessibleName = undefined
                    delete siblings[prop]
                  }
                  value.__accessibleName = prop
                  needRebuild = true
                  treeEvents.emit('move', obj, value.__accessibleName, prop);
                  // delete obj[value.__accessibleName]
                }

              } else {
                console.error('incomplete parent')
                debugger
              }
            }
            else {
              console.error('unknown parent')
              debugger
            }
            // value.__accessibleName = prop
          }


          dbgStruct('setting array prop', prop, value)
        }

        const wasChildAccessible = obj.__accessibleMembers[prop] !== undefined
        const res = Reflect.set(obj, prop, value, thisProxy);

        if (needRebuild) {
          rebuildChildAccessibles(value);
        }
        // const res = true;
        if (prop === accessibleNameSymbol) {
          // TODO notify nameChange

        }
        const isHiddenMember = prop.toString()[0] === '_' || !obj.propertyIsEnumerable(prop);
        const isNotARemoteValue = !obj.__remoteValues || !Object.keys(obj.__remoteValues).includes(prop as string)

        const newAcc = obj[prop];

        if (!blockRecursion && typeof (newAcc) === 'object' && !isHiddenMember) {
          if (typeof (prop) === 'string') {
            if (isNotARemoteValue

              // && !wasChildAccessible
              //   (obj.__accessibleMembers[prop] !== newAcc || obj.__accessibleMembers[prop].__accessibleName === undefined) )
            ) {
              dbgStruct(`auto add child Accessible ${prop.toString()} on `, buildAddressFromObj(obj)); // newAcc, Object.keys(obj.__accessibleMembers));
              setChildAccessible(obj, prop, { immediate: true, defaultValue: newAcc });
            }
          }
        }

        return res;
      }
      ,
      get: (target: any, k: symbol | string, thisProxy: any) => {
        // if(Array.isArray(target)){
        // dbgStruct('getting prop', k)
        // }
        if (k === isProxySymbol) {
          if (target[isProxySymbol]) {
            console.error('proxy nesting !!!!');
            debugger;
          }
          return target;
        } else if (k === accessibleAddressSymbol) {
          return buildAddressFromObj(target);
        } else if ((target instanceof Map || target instanceof Set) && typeof ((target as any)[k]) === 'function') {
          return (target as any)[k].bind(target);
        }

        return Reflect.get(target, k, thisProxy);
      }
      , deleteProperty(target: any, k: symbol | string) {
        if (Array.isArray(target)) {
          dbgStruct('removing prop', k)
        }
        if (k in target) { // TODO lockCallbacks? for deleted objects?
          treeEvents.emit('rm', target, k);
          if (target.__accessibleMembers) { delete target.__accessibleMembers[k]; }
          if (target.__accessibleTypes) { delete target.__accessibleTypes[k]; }

          deleteProp(target, k);
          delete target[k];
          dbgStruct(`property removed: ${k.toString()} on `, buildAddressFromObj(target));
          return true;
        } else {
          return false;
        }
      },
      /*
       apply:(target, thisArg, argumentsList)=>{
         dbgStruct(`applying method child Accessible ${target}`)
         return Reflect.apply(target, thisArg, argumentsList);
      }
      */
    };
    if (childAcc[isProxyfiable]) {
      childAcc.sourceHandler = handler;
      for (const [k, v] of Object.entries(childAcc)) {
        // @ts-ignore
        if (typeof (v) === 'object' && (v === null || !v[isProxySymbol]) && (!childAcc.__remoteValues || childAcc.__remoteValues[k] === undefined)) {
          handler.set(childAcc, k, v, undefined);
        }
      }
    } else if (!childAcc[isProxySymbol]) {
      // recurse on initial values
      for (const [k, v] of Object.entries(childAcc)) {
        // @ts-ignore
        if (typeof (v) === 'object' && (v === null || !v[isProxySymbol]) && (!childAcc.__remoteValues || childAcc.__remoteValues[k] === undefined)) {
          handler.set(childAcc, k, v, undefined);
        }
      }

      childAcc = new Proxy(childAcc, handler);
      if (childAcc.__onProxyfication) { childAcc.__onProxyfication(); }
    } else {

      // debugger;
      console.error('reproxying!!!');

    }
    // const hadProp = parent.hasOwnProperty(key);


    reentrancyLock = true;


    // hack for vue to generate reactive data
    addProp(new Proxy(parent, {
      has(target: any, k: string | symbol) {
        if (k === 'externalController') {
          debugger;
        }
        if (reentrancyLock && k === key) { return false; }
        return Reflect.has(target, key);
      }
    }), key, childAcc);
    reentrancyLock = false;
    const desc = Reflect.getOwnPropertyDescriptor(parent, key) || { value: childAcc, configurable: false };

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
      dbgStruct('avoiding notifying tree change unattached child ', key);
    } else if (key.toString().startsWith('_')) {
      dbgStruct('avoiding notifying tree change of private child ', key);
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
    rebuildChildAccessibles(childAcc);
  } else {
    rebuildChildAccessiblesDebounced(); // debounced
  }

  return parent[key];
}



const allAccessibles = new WeakSet<any>();

type Constructable<I> = new (...args: any[]) => I;
abstract class PConstructableC {
  protected constructor(...args: any[]) { }
}
type PConstructable = PConstructableC["constructor"]
function extendClass<T extends Constructable<any>>(BaseClass: T): typeof DerivedClass {
  const DerivedClass = class extends BaseClass { };

  return DerivedClass;
}

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
export function AccessibleClass() {
  return function <I, T extends Constructable<I>>(Bconstructor: T) {
    // debugger;
    Bconstructor.prototype.__isConstructed = false;
    // @ts-ignore
    // return (...args:any[]):I=> {const r = new Bconstructor(...args);(r as any).isConstructed=true ; return r;} 

    return class AClass extends Bconstructor {
      // @lts-ignore
      public constructor(...args: any[]) {
        super(...args);
        Object.defineProperty(this, '__isConstructed', {
          get: () => true,
          enumerable: false,
          configurable: true,
        })

      }
      __dispose() {
        dbgStruct("dispose", this)
        if ((Bconstructor as any).__dispose) { (Bconstructor as any).__dispose.call(this); }
        if ((this as any).__isConstructed) {
          Object.defineProperty(this, '__isConstructed', {
            get: () => false,
            enumerable: false
          })
        }
        else {
          console.warn('accessible removed twice')
        }
      }
    }

  }

}
export const PAccessibleClass = AccessibleClass


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


export function resolveAccessible(parent: any, addr: string[]) {
  const oriAddr = addr.slice();
  addr = addr.slice(); // copy
  let inspA = addr.shift();
  if (inspA) {

    let insp = parent[inspA];
    let accessibleParent = insp;
    while (insp && addr.length) {
      inspA = addr.shift();
      accessibleParent = insp;
      if (inspA) { insp = insp[inspA]; } else { break; }
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
      if (insp) {
        const regAddr = (insp.getRegisteredAddress && insp.getRegisteredAddress()) || "";
        if (regAddr && addr.join('/') !== regAddr) {
          console.error('accessing a non updated accessible from', addr, ' to ', regAddr)
        }
      }
      return { accessible: insp, parent: accessibleParent, key: inspA };
    }

  }
  debugger;
  console.error("can't find accessible for ", oriAddr, 'stopped at ', addr);
  return { accessible: undefined, parent: undefined };
}
