export const isClient = process.env.VUE_APP_ISCLIENT;
import dbg from './dbg'
const dbgTree = dbg('TREE')
const dbgMsg = dbg('MSG')
const dbgStruct = dbg('STRUCT')
const logServerMessages = process.env.LOG_MSG;

let clientSocket: any = null;
// let ioServer: any = null;
const listenedNodes: { [id: string]: any } = {};
import { addProp, deleteProp, nextTick, isProxyfiable, Proxyfiable } from './MemoryUtils';
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
import { buildEscapedObject } from './SerializeUtils';


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
          if (!isEqual(this.queue[addr][0].msg, params.msg)) { dbgMsg(`overriding msg ${addr} from ${this.queue[addr][0].msg} to ${params.msg}`) }
          else {
            dbgMsg(`message sent twice ${params.msg}`)
          }
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





export const rebuildChildAccessibles = (fromParent?: any, buildTypeTree = true, rebuild = true) => {
  const valSymbol = Symbol('values');
  const funSymbol = Symbol('functions');


  allListeners = new Map();
  const accessibleTree: any = {};
  let curNode = accessibleTree;
  const rS = fromParent || getRoot();

  const recurseAccessible = (o: any) => {
    if (!assert(o !== undefined, 'accessible parsing error')) { return }
    const adUp = new AddressUpdater()
    if (adUp.updateAddr(o, "", false)) {
      Object.defineProperty(o, "__accessibleAddress", {
        value: adUp.registeredAddr,
        enumerable: false
        , configurable: true
      })
    }
    else {
      debugger
      console.error("can't update address")
    }
    if (o && o.__accessibleMembers) {
      for (const name of Object.keys(o.__accessibleMembers)) {
        const last = curNode;
        curNode[name] = { type: o.__accessibleTypes?.[name] };
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
          if (o.__accessibleTypes[l] === undefined) {
            dbg.assert(false, "accessible type not registered", l)
          }
          else {
            curNode[valSymbol].push({ v: l, type: o.__accessibleTypes[l].name, curValue: o[l] });
          }
        }
      }
      if (rebuild) {
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
      if (rebuild) {
        for (const [l, f] of Object.entries(o.__registerFunctionAddr)) {
          o.__registerFunctionAddr[l](o);
        }
      }
    }

  };
  recurseAccessible(rS);
  dbgStruct('updated addr', rS.__isRoot ? "root" : rS?.__accessibleName, accessibleTree); // Array.from(allListeners.keys()));
  if (buildTypeTree) {
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
  if(insp &&!insp[isProxySymbol] && insp.__accessibleParent){
    // debugger
    if(Object.keys(insp.__accessibleParent.__accessibleMembers).includes(insp.__accessibleName)){
      insp = insp.__accessibleParent.__accessibleMembers[insp.__accessibleName]
      if(insp!=o){
        // replace by registered proxy version to use when comparing objects
        // debugger;
      }
    }

  }
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


export function SetAccessible(opts?: ChildAccOptions) {

  return (target: any, key: string | symbol) => {
    defineObjTable(target, "__accessibleProto")[key] = opts
    defineOnInstance(target, key, (parent: any, defaultValue: any) => {

      return setChildAccessible(parent, key, { ...opts, immediate: false, defaultValue });
    },
    );
  };

}

function addRemoteValue(parent: any, k: string | symbol, defaultValue: any, cb?: (parent: any, value: any) => void, type?: any) {
  if ((!type || type === Object) && defaultValue !== undefined && defaultValue.__proto__) {
    type = defaultValue.__proto__.constructor;
  }
  dbg.assert(!!type, "no type found for remote value ", k)
  dbgStruct('add remote value ', k)
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
        notifyAccessibleChange(parent, k.toString());

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
}


function removeRemoteValue(parent: any, key: string | symbol) {
  for (const t of ['__fetch', '__accessibleTypes', '__remoteValues', '__registerRemoteValuesAddr', '__remoteCBs']) {
    if (parent[t]) {
      delete parent[t][key]
    }
  }
}

export function RemoteValue(cb?: (parent: any, value: any) => void) {
  return (target: any, k: string | symbol) => {
    const type = Reflect.getMetadata('design:type', target, k);
    defineOnInstance(target, k,
      (parent: any, defaultValue: any) => {
        return addRemoteValue(parent, k, defaultValue, cb, type)
      });

  };
}

// just check if we are not passing complex args as Vue's
const pruneArg = (e: any, options?: { allowRawObj?: boolean; noRef?: boolean }): any => {
  if (Array.isArray(e)) {
    return e.map(e => pruneArg(e, options));
  } else if (typeof (e) === 'object' && e !== null) {
    if (!(options?.noRef === true)) {
      const addr = buildAddressFromObj(e, false);
      if (addr) { dbgMsg('setting ref addr as arg'); return '/?' + addr; }
      dbg.assert(!!options?.allowRawObj, "setting raw obj as arg")
    }

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

class AddressUpdater {

  public registeredAddr = '';
  public hasValidAddress = false;

  updateAddr(parent: any, key: string | symbol, allowUnhooked = false) {
    this.hasValidAddress = false;
    if (parent && ((parent as any).__isConstructed === false)) {
      return false;
    }
    const pAddr = buildAddressFromObj(parent, !allowUnhooked);
    if (pAddr === null && allowUnhooked) { return null; } else {
      this.hasValidAddress = true;
      const newRAddr = pAddr + '/' + key.toString();
      const hasChanged = newRAddr !== this.registeredAddr;
      if (hasChanged) {
        // allListeners.delete(this.registeredAddr);
        this.registeredAddr = newRAddr;
        // allListeners.set(this.registeredAddr, method);
      }
      this.registeredAddr = newRAddr;
      return hasChanged;
    }

  }

  sendValue(v: any, opts?: { allowRawObj?: boolean; noRef?: boolean }) {
    if (this.hasValidAddress) {
      const prunedVal = pruneArg(v, opts)
      if (isClient) {

        if (AccessibleSettedByServer !== this.registeredAddr) {
          // res = sendToSocketDebounced(registeredAddr, prunedArgs);
          clientToServerQueue.push(this.registeredAddr, prunedVal, true)
        }
      } else {
        serverToClientsQueue.push(this.registeredAddr, prunedVal, true)
        // broadcastMessageFromServer(registeredAddr, prunedArgs);
      }
    }
    else {
      console.error('invalid address updater')
    }
  }
}



export function RemoteFunction(options?: { skipClientApply?: boolean; sharedFunction?: boolean; allowRawObj?: boolean; noRef?: boolean }) {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    const adUp = new AddressUpdater();

    defineObjTable(target, '__accessibleTypes')[key] = {
      fType: Reflect.getMetadata('design:type', target, key),
      pTypes: Reflect.getMetadata('design:paramtypes', target, key) || [],
      rType: Reflect.getMetadata('design:returntype', target, key) || { name: 'undefined' },
      get name() { return `(${this.pTypes.map((e: any) => e.name)})=>${this.rType.name}`; },
      // undefined
    };

    const fl = defineObjTable(target, '__registerFunctionAddr')[key] = (parent: any) => { adUp.updateAddr(parent, key, false) };
    const rf = defineObjTable(target, '__remoteFunctions')[key] = method;
    descriptor.value = function (...args: any[]) { // need plain function for this

      // target.notifyRemote()
      let res: any;
      if (lockCallbacks === 0 && (this as any).__isConstructed !== false) {
        // call on remote
        if (clientSocket) {

          const notifyF = (allowUnhooked: boolean) => {
            adUp.updateAddr(this, key, allowUnhooked);
            if (!adUp.hasValidAddress && allowUnhooked) {
              nextTick(() => notifyF(false));
              return;
            }
            if (!adUp.hasValidAddress) {
              console.error('Remote function can\'t find address');
            }

            adUp.sendValue(args, options)
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
        const v = defaultValue;
        Reflect.defineProperty(ob, key, {
          get: () => {
            dbg.warn('getting server instance of client only :', key, v);
            return v;
          }
          , set: (nv) => {
            debugger;
            dbg.warn('setting server instance of client only :', key)
            // v = nv; // ensure value is not changed on server...
          },
          enumerable: false,
          configurable: false,
        });
        return v;
      });
    };
  } else {
    return () => { }
  }
}



let rootAccessible: any = require('./RootState'); // importing here means we need to take care at importing it first in other modules
function getRoot(hint?: any) {
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

  while (insp && maxDepth > 0) {
    maxDepth--;
    if (insp.__isRoot) { return true; }
    insp = insp.__accessibleParent;
  }
  dbg.assert(maxDepth > 0, "infinite child recursion")
  return false;
}

const allAccessibleSet = new WeakSet();
const accessibleNameSymbol = Symbol('name');
const accessibleAddressSymbol = Symbol('address');
const setContextSymbol = Symbol('context');
export const isProxySymbol = Symbol('isProxy');
let accessibleChildBeingBuilt: any | undefined = undefined
let reentrancyLock = false;

type ChildAccOptions = { onChange?: (parent: any, el: any, valueName?: string) => void; immediate?: boolean; defaultValue?: any; readonly?: boolean; autoAddRemoteValue?: boolean; blockRecursion?: boolean; noRef?: boolean }
export function setChildAccessible(parent: any, key: string | symbol, opts?: ChildAccOptions) {
  if (reentrancyLock) {
    return parent[key];
  }
  // if (opts?.autoAddRemoteValue) {
  //   debugger
  // }
  // if (key === 'Master' || key === 'pinputs') {
  //   debugger;
  // }

  const { defaultValue, immediate, blockRecursion } = opts || {};
  let { readonly } = opts || {};

  readonly = true // try to set all as readonly per default
  let childAcc = defaultValue !== undefined ? defaultValue : parent[key];
  if (!accessibleChildBeingBuilt) {
    // debugger
    accessibleChildBeingBuilt = childAcc
  }
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

    defineObjTable(childAcc, '__accessibleMembers'); //

    const types = defineObjTable(parent, '__accessibleTypes');

    let curType = Reflect.getPrototypeOf(childAcc)
    if (curType?.constructor?.name === "AClass") { // ignore Accessible Class
      curType = Reflect.getPrototypeOf(curType)
    }
    if (types[key] && types[key] !== curType.constructor) {
      console.error('changing type of accessible');
      debugger;
    }
    types[key] = curType.constructor;

    //
    const childOpts = { ...opts }
    childOpts.onChange = undefined
    const handler = generateAccessibleHandler(childOpts)


    if (key === "actions") {
      // debugger
    }


    //////////////
    // recurse on initial values
    if (childAcc[isProxyfiable]) {
      childAcc.sourceHandler = handler;
      for (const [k, v] of Object.entries(childAcc)) {

        if (!isHiddenMember(k, childAcc))
          if ((v === null || typeof v !== "object" || !(v as any)[isProxySymbol])) {
            if ((!childAcc.__remoteValues || childAcc.__remoteValues[k] === undefined)) {
              handler.set(childAcc, k, v, undefined);
            }
          }
          else {
            // rebuildChildAccessibles(childAcc[k])
          }
      }
    } else if (!childAcc[isProxySymbol]) {

      for (const [k, v] of Object.entries(childAcc)) {

        // if (typeof (v) === 'object')
        if (!isHiddenMember(k, childAcc))
          if ((v === null || typeof v !== "object" || !(v as any)[isProxySymbol])) {
            if ((!childAcc.__remoteValues || childAcc.__remoteValues[k] === undefined)) {
              handler.set(childAcc, k, v, undefined);
            }
          }
          else {
            // rebuildChildAccessibles(childAcc[k])
          }
      }

      childAcc = new Proxy(childAcc, handler);
      if (childAcc.__onProxyfication) { childAcc.__onProxyfication(); }


    } else {

      // debugger;

      console.error('reproxying!!!');
      childAcc.__undispose?.() // ensure object is redisposed
      changeAccessibleName(childAcc, key.toString())
      return;

    }
    // const hadProp = parent.hasOwnProperty(key);





    // hack for vue to generate reactive data
    reentrancyLock = true;
    addProp(new Proxy(parent, {
      has(target: any, k: string | symbol) {
        if (reentrancyLock && k === key) { return false; }
        return Reflect.has(target, key);
      }
    }), key, childAcc);
    reentrancyLock = false;
    const oldDesc = Reflect.getOwnPropertyDescriptor(parent, key) || {};// || { value: childAcc, configurable: false };


    //use a setter / getter to prevent accidental overwriting Proxy, usually hapen in constructor
    if (oldDesc?.writable === false) readonly = true
    const desc = {
      get() {
        if (oldDesc.get) {
          oldDesc.get() // reactive getter triggers vue dependency mechanism
        }
        return childAcc
      },
      set(v: any) {
        // if (readonly &&
        //   !(
        //     accessibleChildBeingBuilt === (parent[key] as any)
        //     || v[isProxySymbol]
        //   )) {
        // debugger
        // console.error('trying to set readonly');
        // }
        // if (oldDesc.set) {
        // oldDesc.set(v) // Vue reactive setter seems to be called any way...
        // }
        if (v[isProxySymbol]) {
          if (!(accessibleChildBeingBuilt && accessibleChildBeingBuilt === (parent[key] as any))) {
            console.error("dangerously changing childAccessible layout")
            debugger
          }
          childAcc = v;
        }
        else {
          updateChildAccessible(childAcc, v, parent[key].__isConstructed !== false, opts) // do sync to new object but do not send as it should happen only in constructor
        }

        return childAcc
      }

    }


    Reflect.defineProperty(parent, key, desc);

    if (opts?.onChange) {
      const cCB = opts.onChange
      if (childAcc.__changeCB) {
        debugger
      }
      Object.defineProperty(childAcc, '__changeCB',
        {
          value: (el: any, valueName?: string) => {
            doSharedFunction(() => {
              cCB(parent, el, valueName)
            }
            )
          },
          enumerable: false,
          writable: true
        });

    }

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
  if (opts?.autoAddRemoteValue && !isHiddenMember(key, childAcc)) {
    const adUp = new AddressUpdater()
    adUp.updateAddr(parent, key, false)
    if (adUp.hasValidAddress) {
      adUp.sendValue(childAcc, { noRef: opts?.noRef });

    }
  }
  accessibleChildBeingBuilt = undefined
  return parent[key];
}


export function changeAccessibleName(a: any, n: string) {
  if (a[isProxySymbol]) {
    a.__accessibleName = n;
    rebuildChildAccessibles(a);
  }
  else {
    console.error("trying to change name of non accessible")
    debugger
  }
}


function removeChildAccessible(target: any, k: string | symbol, opts?: { doNotDelete?: boolean }) {
  treeEvents.emit('rm', target, k);
  if (target.__accessibleMembers) { delete target.__accessibleMembers[k]; }
  if (target.__accessibleTypes) { delete target.__accessibleTypes[k]; }
  removeRemoteValue(target, k)
  let action = "deleted"
  if (!opts?.doNotDelete) {

    deleteProp(target, k);
    delete target[k];

  } else {
    target[k].__accessibleName = undefined
    target[k].__accessibleParent = undefined;
    action = "untagged"
  }
  const addr = buildAddressFromObj(target)
  if (addr === "/stateList/states/pp/fixtureStates") {
    debugger
  }
  dbgStruct(`property ${action}: ${k.toString()} on `, addr);
}

function updateChildAccessible(childAcc: any, ob: any, doSend: boolean, opts?: ChildAccOptions) {
  if (
    !dbg.assert(childAcc && childAcc[isProxySymbol], "updating non proxy")
    || !dbg.assert(ob, "invalid object")) {
    const t = childAcc && childAcc[isProxySymbol]
    return;
  }

  const newMembers = Object.keys(ob)
  let currentMembers = Object.keys(childAcc.__accessibleMembers)
  if (childAcc.__remoteValues) {
    currentMembers = currentMembers.concat(Object.keys(childAcc.__remoteValues))
  }
  const oldNotified = notifiedAccessible
  notifiedAccessible = childAcc

  const isArray = childAcc.length!== undefined ; //Array.isArray(childAcc);
  const delMember = (o: Array<string>,n: string,assertIfNull = false)=>{
    const i = o.indexOf(n);
    if(i>=0){
      o.splice(i,1)
      return true
    }
    else if(assertIfNull){
      console.error("member not found",n, "in" , o);
      debugger
      return false
    }
  }
  if (isArray) { // nasty hack to handle array updates
    childAcc.splice(0,childAcc.length-1)
    let idx = 0
    while(ob[idx]!==undefined){
      childAcc.push(ob[idx])
      delMember( newMembers,""+idx,true)
      idx++
    }
    idx = 0
    while(delMember( currentMembers,""+idx,false)){
      idx++
    }

  }

  for (const k of currentMembers) {

    if (!newMembers.includes(k)) {
      //removeChildAccessible(childAcc, k)
      delete childAcc[k]
    }
  }



  for (const [k, v] of Object.entries(ob)) {
    if (isHiddenMember(k, ob)) { continue; }

    if (!currentMembers.includes(k)) {
      if (typeof v === "object") {
        setChildAccessible(childAcc, k, { ...opts, immediate: true, defaultValue: v })
      }
      else if (opts?.autoAddRemoteValue) {
        addRemoteValue(childAcc, k, v)
      }

    } else {
      if (typeof v === "object") {
        updateChildAccessible(childAcc.__accessibleMembers[k], v, false, opts)
      }
      else {

        doSharedFunction(() => {
          childAcc[k] = v // should call appropriate setter but avoid notifying change
        })

      }
    }
  }
  notifiedAccessible = oldNotified
  if (doSend) {
    const adUp = new AddressUpdater()
    const p = childAcc.__accessibleParent
    const n = childAcc.__accessibleName
    adUp.updateAddr(p, n, false)
    adUp.sendValue(ob, { noRef: true })
    notifyAccessibleChange(childAcc);
  }
}
let notifiedAccessible: any = undefined // used to aggregate changes when rebuilding
function notifyAccessibleChange(childAcc: any, valueName?: string) {
  if (notifiedAccessible === childAcc && valueName) { return }
  let insp = childAcc
  while (insp) {
    if (insp.__changeCB) { insp.__changeCB(childAcc, valueName) }
    insp = insp.__accessibleParent
  }
}

export function getParentWithName(childAcc: any, n: string) {
  let insp = childAcc?.__accessibleParent
  while (insp) {
    if (insp.__accessibleName === n) { return insp }
    insp = insp.__accessibleParent
  }

}

export function findLocationInParent(childAcc: any, n: string) {
  let insp = childAcc?.__accessibleParent
  const path = new Array<any>(childAcc)

  while (insp) {
    if (insp.__accessibleName === n) { return path }
    path.unshift(insp);
    insp = insp.__accessibleParent
  }
  return undefined
}

function findPropertyDescriptor(prop: string | symbol, obj: any) {
  while (obj) {
    const d = Reflect.getOwnPropertyDescriptor(obj, prop)
    if (d) { return d }
    obj = Object.getPrototypeOf(obj)
  }
}
function isHiddenMember(prop: string | symbol, obj: any) {
  const desc = findPropertyDescriptor(prop, obj)
  return prop.toString()[0] === '_' || desc?.enumerable === false || desc?.set !== undefined
}

function generateAccessibleHandler(opts?: { blockRecursion?: boolean; autoAddRemoteValue?: boolean; noRef?: boolean }) {

  return {
    set(obj: any, prop: symbol | string, value: any, thisProxy: any) {
      if (prop === "inputs") {
        debugger
      }
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
                  // siblings[prop].__accessibleName = undefined
                  // delete siblings[prop]
                  removeChildAccessible(obj, prop, { doNotDelete: true })
                }
                value.__accessibleName = prop
                needRebuild = true
                // removeChildAccessible(obj, value.__accessibleName, { doNotDelete: true })
                treeEvents.emit('move', obj, value.__accessibleName, prop);
                // delete obj[value.__accessibleName]
              }

            } else {
              console.error('incomplete parent')
              debugger
            }
          }
          else {
            console.warn('unknown parent')
            // debugger
          }
          // value.__accessibleName = prop
        }


        dbgStruct('setting array prop', prop, value)
      }
      accessibleChildBeingBuilt = obj[prop]

      const wasChildAccessible = obj.__accessibleMembers[prop] !== undefined
      const res = Reflect.set(obj, prop, value, thisProxy);

      if (needRebuild) {
        rebuildChildAccessibles(obj[prop]);
      }
      // const res = true;
      if (prop === accessibleNameSymbol) {
        // TODO notify nameChange

      }
      const isHidden = isHiddenMember(prop, obj);
      const isNotARemoteValue = !obj.__remoteValues || !Object.keys(obj.__remoteValues).includes(prop as string)

      const newAcc = obj[prop];

      if (!opts?.blockRecursion && !isHidden) {
        if (typeof (prop) === 'string') {
          if (typeof (value) === 'object') {
            if (isNotARemoteValue
              // && !wasChildAccessible
              //  && (obj.__accessibleMembers[prop] !== newAcc || obj.__accessibleMembers[prop].__accessibleName === undefined) )
            ) {
              if (wasChildAccessible) {
                dbgStruct(`auto update child Accessible ${prop.toString()} on `, buildAddressFromObj(obj));
                updateChildAccessible(obj[prop], value, !!opts?.autoAddRemoteValue, opts)
              }
              else {
                dbgStruct(`auto add child Accessible ${prop.toString()} on `, buildAddressFromObj(obj)); // newAcc, Object.keys(obj.__accessibleMembers));
                setChildAccessible(thisProxy || obj, prop, { ...opts, immediate: true, defaultValue: newAcc });
              }
            }
          }
          else if (opts?.autoAddRemoteValue) {
            addRemoteValue(obj, prop, value)
          }
        }

      }

      accessibleChildBeingBuilt = undefined
      // if (opts?.autoAddRemoteValue && !isHidden && typeof(value)!=="object") {
      //   if(!obj.__remoteValues || !Object.keys(obj.__remoteValues).includes(prop.toString())){
      //     addRemoteValue(obj,prop,value)
      //     const adUp = new AddressUpdater()
      //     adUp.updateAddr(obj, prop, false)
      //     if (adUp.hasValidAddress) {
      //       adUp.sendValue(value,opts)
      //     }else{
      //       debugger
      //     }
      //   }
      //   else{
      //     dbg.assert(false,"calling set on remote value")
      //     obj[prop] = value
      //   }



      // }

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
        removeChildAccessible(target, k)
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


export function AccessibleClass() {
  return function <I, T extends Constructable<I | unknown>>(Bconstructor: T) {
    // debugger;
    Bconstructor.prototype.__isConstructed = false;
    // @ts-ignore
    // return (...args:any[]):I=> {const r = new Bconstructor(...args);(r as any).isConstructed=true ; return r;} 

    return class AClass extends Bconstructor {
      // @lts-ignore
      public constructor(...args: any[]) {
        super(...args);

        const aProto = (this as any).__accessibleProto
        if (aProto) {
          for (const [k, v] of Object.entries(aProto)) {
            const existing = (this as any)[k]
            if (!existing || !existing[isProxySymbol]) {

              dbgStruct("re proxyfing accessible child", k, existing)
              debugger
              const opts = v as any
              setChildAccessible(this, k, { immediate: false, ...opts })
            }


          }
        }
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
            enumerable: false,
            configurable: true
          })
        }
        else {
          console.warn('accessible removed twice')
        }
      }

      __undispose() {
        dbgStruct("undispose", this)
        if ((Bconstructor as any).__undispose) { (Bconstructor as any).__undispose.call(this); }
        if (!(this as any).__isConstructed) {
          Object.defineProperty(this, '__isConstructed', {
            get: () => true,
            enumerable: false,
            configurable: true
          })
        }
        else {
          // console.warn('accessible redisposed twice')
        }

      }
    }

  }

}
export const PAccessibleClass = AccessibleClass

const fakeParent = {}
export class AutoAccessible {
  // private __accessibleName= "unknown"
  // private __accessibleParent = null
  constructor() {
    // super()

    // defineObjTable(this, '__accessibleMembers');
    // defineObjTable(this,'__accessibleTypes');

    return setChildAccessible(fakeParent, "unknown", { defaultValue: this })//new Proxy(this,generateAccessibleHandler({blockRecursion:false,autoAddRemoteValue:true}))
  }
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
        if (!accessibleParent?.__ob__) {
          debugger;
        }
        if (!insp?.__ob__) {
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


export class RemoteMap<T>  {
  constructor(defaultValue: any, private genEl: (...args: any[]) => T | undefined = (o: any) => { return o }) {
    if (defaultValue) Object.entries(defaultValue).map(([k, v]) => { this.setAtKey(k, v) })
    return new Proxy(this, {
      set(target, key, value) {
        if (isHiddenMember(key.toString(), this)) {
          return Reflect.set(target, key, value)
        }
        // debugger;
        return target.setAtKey(key, value)

      },
      deleteProperty(target, key) {
        if (isHiddenMember(key.toString(), this)) {
          return Reflect.deleteProperty(target, key)
        }

        return target.rmAtKey(key)

      }
    })
    // this.configureFromObj = this.configureFromObj.bind(this)
  }

  private __locked = false;
  @RemoteFunction({ sharedFunction: true, allowRawObj: true })
  setAtKey(k: string | number | symbol, v: any) {
    if (this.__locked) { debugger; return true; }
    this.__locked = true

    // const res =  Reflect.set(this, k, v);
    if (typeof (v) === "object") {
      setChildAccessible(this, k.toString(), { immediate: true, defaultValue: v })
    } else if (v !== null && v !== undefined) {
      addRemoteValue(this, k.toString(), v)
    }
    else {
      dbg.assert(false, "can't set null or undef on map")
    }
    this.__locked = false;
    return true
  }

  @RemoteFunction({ sharedFunction: true, allowRawObj: true })
  rmAtKey(k: string | number | symbol) {
    if (this.__locked) { debugger; return true; }
    this.__locked = true
    removeChildAccessible(this, k.toString())
    // const res =   Reflect.deleteProperty(this, k);
    this.__locked = false;
    return k in this

  }
  @RemoteFunction({ sharedFunction: true, allowRawObj: true })
  setFromObj(o: T) {
    this.clear()
    for (const [k, v] of Object.entries(o)) {
      if (!isHiddenMember(k, o)) {
        this.setAtKey(k, v)
      }
    }
  }

  @RemoteFunction({ sharedFunction: true })
  clear() {
    this.__locked = true
    for (const k of Object.keys(this)) {
      const obj = (this as any)[k]
      if (typeof (obj) !== 'function' && !isHiddenMember(k, this)) {
        Reflect.deleteProperty(this, k)
      }
    }
    this.__locked = false
  }
}

export function AccessibleMap() {
  return (target: any, key: string | symbol) => {
    defineOnInstance(target, key, (ob, defaultValue) => {
      debugger;
      return new RemoteMap(defaultValue);
    })
  }

}

export class RemoteArray<T>{
  // private __list = new Array<T>()
  constructor(private genEl: (...args: any[]) => T | undefined = (o: any) => { return o }) {
    return new Proxy(this, {
      set(target, name, value) {
        // debugger;
        if (!isNaN(name as number)) {
          return target.setAtIdx(name as number, value)
        }
        console.warn('unhandled set', name)

        return Reflect.set(target, name, value)
      },
      deleteProperty(target, key) {
        // debugger
        if (!isNaN(key as number)) {
          target.splice(key as number, 1)
        }
        else {
          console.error('ignoring remote array delete')
        }

        return true
      }
    })
    // this.configureFromObj = this.configureFromObj.bind(this)
  }
  private get l() { return this.plist; }
  private get list() { return this.l }
  // get __list(){return this};

  @SetAccessible()
  private plist = new Array<T>()

  @RemoteFunction({ sharedFunction: true })
  swapIndexes(a: number, b: number) {
    this.l[b] = (this.callM("slice", a, 1))[0]
  }
  private callM(name: string, ...args: any[]) {
    // Array.prototype[name].call(this.l,...args);
    //@ts-ignore
    return this.l[name](...args)

  }
  @RemoteFunction({ sharedFunction: true })
  swap(a: T, b: T) {
    const ia = this.l.indexOf(a)
    const ib = this.l.indexOf(b)
    if (this.validIdx(ia) && this.validIdx(ib)) {
      this.swapIndexes(ia, ib)
    }
  }

  @RemoteFunction({ sharedFunction: true })
  push(a: T | undefined) {
    if (a !== undefined && a !== null) {
      return this.callM("push", a)

    }
    return this.l.length
  }

  @RemoteFunction({ sharedFunction: true })
  splice(i: number, deleteN: number) {
    return this.callM("splice", i, deleteN)
  }


  @RemoteFunction({ sharedFunction: true })
  setAtIdx(i: number, v: T) {
    return Reflect.set(this, i, v)
  }

  @RemoteFunction({ sharedFunction: true })
  slice(start?: number, end?: number) {
    return this.callM("slice", start, end)
  }

  @RemoteFunction({ sharedFunction: true })
  shift() {
    return this.callM("shift")
  }
  @RemoteFunction({ sharedFunction: true })
  unshift(...items: any[]) {
    return this.callM("unshift", ...items)
  }

  @RemoteFunction({ sharedFunction: true })
  clear() {
    this.callM("splice", 0, this.length)
  }

  map(fn: (p: T) => any, thisArg?: any) {
    return this.l.map(fn, thisArg)
  }
  indexOf(a: T): number {
    return this.l.indexOf(a)
  }

  get length(): number { return this.l.length }

  i(id: number) {
    return this.l[id]
  }


  [Symbol.iterator]() {
    let counter = 0;
    return {
      next: () => {
        if (counter < this.l.length) { return { value: this.l[counter++], done: false } }
        else { return { value: undefined as unknown as T, done: true } }
      }
    }
  }

  validIdx(i: number) { return i >= 0 && i < this.l.length }

  toJSON() {
    return this.l as any;
  }//.map((e: any) => e.toJSON()) as any }

  @RemoteFunction({ sharedFunction: true })
  setFromList(o: any[]) {
    this.configureFromObj(o);
  }

  configureFromObj(o: any) {
    if (!Array.isArray(o)) {
      console.error('not an array')
      // debugger
    }
    this.clear()

    o?.map((e: any) => {
      const newEl = this.genEl(e) as any
      this.push(newEl)
      if (newEl?.configureFromObj) {
        // debugger
        newEl.configureFromObj(e)
      }
    })


  }


}


export function toRefString(o: any) {
  if (typeof o === "string") {
    if (o.startsWith("/")) {
      if (!o.startsWith('/?')) {
        return '/?' + o;
      }
      else { return o }
    }
    else { console.error('wrong ref string') }

  } else {
    return buildAddressFromObj(o, true) || "unknown"
  }
}

export function resolveRefString(s: string) {
  const addrList = s.split('/')
  if (addrList.length && addrList[0] === '') { addrList.shift(); }
  if (addrList.length && addrList[0] === '?') { addrList.shift(); }

  const { accessible, parent, key: acc_key } = resolveAccessible(rootAccessible, addrList);
  return accessible
}

export class Ref<T>{
  @nonEnumerable()
  private addr = "unknown"
  constructor(_a = "unknown") {
    if (typeof _a !== "string") {
      console.error(
        "trying to set ref from non string"
      )
      debugger;

    }
    this.addr = _a;
  }
  toJSON() {
    return toRefString(this.addr)
  }

  get(): T | undefined {
    return resolveRefString(this.addr) as T;
  }
  static fromObj(o: any) {
    return new Ref(toRefString(o));
  }
  static fromAddr(addr: string) {
    return new Ref(addr)
  }
}