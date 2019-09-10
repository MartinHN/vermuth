const isClient = process.env.VUE_APP_ISCLIENT;
const logServerMessages = process.env.LOG_MSG;
let clientSocket: any = null ;
// let ioServer: any = null;
const listenedNodes: {[id: string]: any} = {};
import {addProp, nextTick} from './MemoryUtils';
let allListeners: {[id: string]: (args: any[]) => void} = {};
let AccessibleSettedByServer: any = null;
let AccessibleNotifierId: string|null = null;
let lockCallbacks = 0;
import * as _ from 'lodash';
import { Socket } from 'socket.io';

export function bindClientSocket(s: any) {

  if (s !== 'auto' && s) { // only on new socke
    const boundSocket = s;
    if (!isClient && boundSocket) {
      const emitF = boundSocket.emit;
      const log = require('./Logger').default;
      console.log('highjacking server socket');
      const nF = (e: string, a: any, l: any) => {
        if (logServerMessages) {
          log.log('server >> client : ' + e + ' : ' + a + '\n');
        }
        emitF.apply(boundSocket, [e, a, l]);
      };

      boundSocket.emit = nF;
    }
  }
  safeBindSocket(s);


}

const rebuildAccessibles = () => {

  const f = (o: any) => {
    if (o === undefined) {
      console.error('accessible parsing error');
      // debugger;
      return;
    }
    if (o.__accessibleMembers) {
      for ( const a of Object.values(o.__accessibleMembers)) {
        f(a);
      }
    }
    const remotesV = initRemoteValues(o);
    remotesV.map((ff) => ff());
    const remotesF = initRemoteFunctions(o);

    remotesF.map((ff) => ff());

    // initRemoteFunction(o)
  };


  allListeners = {};
  const rS = require('./RootState').default;
  f(rS);
  console.log('listen to messages' , allListeners);
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
          if (accessible !== args) {parent[key] = args; }
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
  rebuildAccessibles();

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
      // throw new Error(
      console.error(
        'can\'t find address on object' + o);
    }
    return null;
  }

}




export function RemoteFunction(options?: {skipClientApply?: boolean, sharedFunction?: boolean}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    let registeredAddr: string = '';

    if (target.__remoteFunctions === undefined) {
      Object.defineProperty(target, '__remoteFunctions', {
        value: {},
        enumerable: false,
        configurable: false,
        writable: true,
      });

    }
    target.__remoteFunctions[propertyKey] = method;

    // }
    descriptor.value = function (...args: any[]){
      // target.notifyRemote()
      let res: any;
      if (lockCallbacks === 0) {
        if (clientSocket ) {

          const regF = (allowUnhooked: boolean) => {
            const pAddr =  buildAddressFromObj(this, !allowUnhooked);
            if (pAddr === null && allowUnhooked) {
              nextTick(() => regF(false));
              return;
            }
            const raddr = pAddr + '/' + propertyKey;

            // @ts-ignore
            if (registeredAddr !== raddr) {
              Object.defineProperty(this, '__emitF', {
                value: _.debounce((addr: string, targs: any) => {
                  clientSocket.emit(addr, targs);
                }, isClient ? 10 : 10 + Math.random() * 5,
                {trailing: true, maxWait: isClient ? 30 : 30}),
                enumerable: false,
                configurable: false,
                writable: true,
              });
              registeredAddr = raddr;
            }
            // @ts-ignore
            if (this.__emitF && (AccessibleSettedByServer !== raddr ) ) {
              // @ts-ignore
              res = this.__emitF(registeredAddr, args);
            } 
            broadcastMessage(registeredAddr,args);
          };

          regF(true);


        } else  {

          console.error('can\'t reach server on RemoteFunction : ', propertyKey);
        }
      }


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


function broadcastMessage(addr:string,args:any){

  if (!isClient && clientSocket && clientSocket.sockets) {
    // broadcast to other clients if we are server
    const curId = AccessibleNotifierId;
    for (const s of Object.values(clientSocket.sockets.sockets)) {
      const sock = s as Socket
      if (sock.id !== AccessibleNotifierId) {
        sock.emit(addr, args);

      }
    }

    // console.warn("avoid feedback");
  }
}

export function SetAccessible() {

  return (target: any, key: string | symbol) => {
    const val = target[key];
    if (target.__accessibleMembers === undefined) {
      Object.defineProperty(target, '__accessibleMembers', {
        value: {},
        enumerable: false,
        configurable: false,
        writable: true,
      });
    }

    target.__accessibleMembers[key] = val;


  };
}



export function RemoteValue(cb?: (parent: any, value: any) => void) {

  return (target: any, key: string | symbol) => {
    const val = target[key];
    if (target.__remoteValues === undefined) {
      Object.defineProperty(target, '__remoteValues', {
        value: {},
        enumerable: false,
        configurable: false,
        writable: true,
      });
      Object.defineProperty(target, '__remoteCBs', {
        value: {},
        enumerable: false,
        configurable: false,
        writable: true,
      });
      Object.defineProperty(target, '__fetch', {
        get: () => target.__remoteValues,
        enumerable: false,
        configurable: false,
      });
    } else if (target.__remoteCBs === undefined) {
      console.error('weird target __remoteValue already created but no __remoteCBs');
      debugger;
    }
    target.__remoteCBs[key] = cb;
    // debugger
    target.__remoteValues[key] = val;


  };
}


function initAccessibles(parent: any) {
  if (parent.__accessibleMembers) {
    for (const k of Object.keys(parent.__accessibleMembers)) {
      setChildAccessible(parent, k);
    }
  }
}
function initRemoteValues(parent: any) {
  const res = [];
  if (parent.__remoteValues) {
    for (const k of Object.keys(parent.__remoteValues)) {
      res.push(initRemoteValue(parent, k));
    }
  }
  return res;
}
function initRemoteFunctions(parent: any) {
  const res = [];
  if (parent.__remoteFunctions) {
    for (const k of Object.keys(parent.__remoteFunctions)) {
      res.push(initRemoteFunction(parent, k));
    }
  }
  return res;
}
function initRemoteFunction(parent: any, k: string) {

  if (parent.__initRemoteFunctionClosures === undefined) {
    Object.defineProperty(parent, '__initRemoteFunctionClosures', {
      value : {},
      writable: true,
      enumerable: false,
      configurable: false,
    });

  }
  if (parent.__initRemoteFunctionClosures[k] === undefined) {
    let registredAddr = '';
    let registeredClientSocket: any = null;
    const method  = parent[k];
    const listenerFunction = (args: any[]) => { // socket io send arg as array dont rest out
      AccessibleNotifierId = registeredClientSocket ? registeredClientSocket.id : null;
      AccessibleSettedByServer = registredAddr;
      if (!Array.isArray(args)) {
        method.call(parent, args);
      } else {
        method.call(parent, ...args);
      }

      AccessibleSettedByServer = null;
      AccessibleNotifierId = null;
    };
    parent.__initRemoteFunctionClosures[k]  = () => {
      nextTick(() => {
        const a = buildAddressFromObj(parent) + '/' + k;
        if (registredAddr !== a || clientSocket !== registeredClientSocket) {
          if (clientSocket && isClient) {// only client need to specify (server use middleware)
            clientSocket.removeListener(registredAddr, listenerFunction);
            clientSocket.on(a, listenerFunction);
            registeredClientSocket = clientSocket;
          }
          delete allListeners[registredAddr];
          registredAddr = a;
        }
        allListeners[a] = listenerFunction;

      });
    };

  }
  return parent.__initRemoteFunctionClosures[k];

}
function initRemoteValue(parent: any, k: string) {

  if (parent.initValueClosures === undefined) {
    Object.defineProperty(parent, 'initValueClosures',
      {value: {},
      writable : true,
      enumerable: false,
      configurable: false});
  }
  if (parent.initValueClosures[k] === undefined) {
    let storedValue: any = parent[k];


    let registredAddr = '';
    let registeredClientSocket = {};
    const listenerFunction = (msg: any) => {



      // addProp(parent,k,msg);
      parent[k] = msg;
      storedValue = msg;
      broadcastMessage(registredAddr,msg)



    };

    const registerListener = (deferIfUnattached = true) => {
      nextTick(() => {
        const pAddr = buildAddressFromObj(parent);
        const a =  pAddr + '/' + k;
        if (registredAddr !== a || clientSocket !== registeredClientSocket) {
          if (clientSocket && isClient) {// only client need to specify (server use middleware)
            clientSocket.removeListener(registredAddr, listenerFunction);
            clientSocket.on(a, listenerFunction);
            registeredClientSocket = clientSocket;
          }
          delete allListeners[registredAddr];
          registredAddr = a;


        }
        allListeners[a] = listenerFunction;

      });
    };

    const getter = () => {
      return storedValue;
    };

    const fetchFunction = (cb: (...args: any[]) => any) => {
      registerListener();
      if (clientSocket ) {
        clientSocket.emit(registredAddr, undefined, cb);
      }
    };
    const emitF = isClient ? (addr: any, args: any) => {
      clientSocket.emit(addr, args);
    } :
    _.debounce((addr: any, args: any) => {
      clientSocket.emit(addr, args);
    }, 50,
    {trailing: true, maxWait: 100});
    const setter = (v: any) => {


      registerListener();
      if (lockCallbacks === 0) {
        if (clientSocket ) {
          // listenedNodes[addr] = true
          // debugger

          if (!_.isEqual(v, storedValue)) {// for array
            storedValue = v;
            const cb = parent.__remoteCBs[k];
            // debugger
            if (cb) {cb(parent, v); }

            emitF(registredAddr, v);

          }
        }
      }
    };
    Object.defineProperty(parent, k, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
    parent.__remoteValues[k] = fetchFunction;
    parent.initValueClosures[k] = registerListener;

  }

  return parent.initValueClosures[k];


}

export function setChildAccessible(parent: any, k: string|symbol) {

  Object.defineProperty(parent[k], '__accessibleParent', {
    value: parent,
    enumerable: false,
    configurable: false,
    writable: true,
  });

  Object.defineProperty(parent[k], '__accessibleName', {
    value: k,
    enumerable: false,
    configurable: false,
    writable: true,
  });
  if (parent.__accessibleMembers === undefined) {
    Object.defineProperty(parent, '__accessibleMembers', {
      value: {},
      enumerable: false,
      configurable: false,
      writable: true,
    });

  }

  parent.__accessibleMembers[k] = parent[k] || parent.__accessibleMembers[k];

  rebuildAccessiblesDebounced(); // debounced
}



const allAccessibles = new Set<any>();
export function AccessibleClass() {

  return function<T extends new(...args: any[]) => {}>  (constructor: T) {
    return class extends constructor {

      private __remoteValues: any;
      constructor(...args: any[]) {

        super(...args); // not working properly in chrome...
        if (allAccessibles.has(this)) {
          debugger;
          console.error('recreating accessible');
        }
        allAccessibles.add(this);

        initAccessibles(this);
        initRemoteValues(this);
        initRemoteFunctions(this);
      }

      public __dispose() {
        allAccessibles.delete(this);
      }




    };
  };
}

export function fetchRemote(o: any, k: string, cb?: (...args: any[]) => any) {
  if (o.__remoteValues !== undefined && o.__remoteValues[k]) {
    o.__remoteValues[k](cb);
  }
}

export function nonEnumerable() {
  return function(target: any, key: string | symbol)  {

    Object.defineProperty(target, key, {
      set: (value) => {
        Object.defineProperty(target, key, {
          value,
          enumerable: false,
          configurable: false,
          writable: true,
        } );
      },
      enumerable: false,
      configurable: true,
    });



  };
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
      return {accessible: insp, parent: accessibleParent, key: inspA};
    }

  }
  console.error('can\'t find accessible for ', oriAddr, 'stopped at ', addr);
  return {accessible: undefined, parent: undefined};
}
