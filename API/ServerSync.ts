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
        boundSocket.onevent =  function(packet: any) {
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
  (addr: string, targs: any) => {clientSocket.emit(addr, targs);},
  10 ,
  {trailing: true, maxWait: 30})


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
    // const remotesF = initRemoteFunctions(o);

    // remotesF.map((ff) => ff());

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



const broadcastMessageFromServerDebounced = _.debounce((addr:string,args:any) => {broadcastMessageFromServer(addr, args);}
  , 50, {trailing: true, maxWait: 100});
function broadcastMessageFromServer(addr: string, args: any) {
  // let log;
  if(!addr){
    debugger
  }
  else{
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




function defineObjTable(obj:any,tableName:string){
  if (!obj[tableName]) {
    Object.defineProperty(obj, tableName, {
      value: {},
      enumerable: false,
      configurable: false,
      writable: true,
    } );
  }

  return obj[tableName]
}

function defineOnInstance(target:any,key:string | symbol,onInstance:(o:any,defaultV:any)=>any){
  Object.defineProperty(target, key, {
    get(){onInstance(this,null);return null},
    set(nv){ onInstance(this,nv);},
    enumerable: true,
    configurable: true

  } );

}

export function SetAccessible(opts?:{readonly?:boolean}){
  const writable = !opts || !opts.readonly
  return (target: any, key: string | symbol) => {
    defineOnInstance(target,key,(parent:any,defaultValue:any)=>{
      defineObjTable(parent,'__accessibleMembers')[key] = defaultValue
      Object.defineProperty(parent, key, {
        value:defaultValue,
        enumerable: true,
        configurable: true,
        writable
      } );
      
    }
    )
  }

}


export function RemoteValue(cb?: (parent: any, value: any) => void) {
  return (target: any, k: string | symbol) => {
    defineOnInstance(target,k,
      (parent:any,defaultValue:any)=>{

        let storedValue: any = defaultValue;
        let registredAddr = '';
        let registeredClientSocket = {};
        const listenerFunction = (msg: any) => {
          // parent[k] = msg;
          // storedValue = msg;
          // broadcastMessageFromServer(registredAddr, msg);
        };

        const registerListener = (deferIfUnattached = true) => {
          // nextTick(() => {
            const pAddr = buildAddressFromObj(parent);
            const a =  pAddr + '/' + k.toString();
            if (registredAddr !== a || clientSocket !== registeredClientSocket) {
              if (clientSocket && isClient) {// only client need to specify (server use middleware)
                // clientSocket.removeListener(registredAddr, listenerFunction);
                // clientSocket.on(a, listenerFunction);
                registeredClientSocket = clientSocket;
              }
              delete allListeners[registredAddr];
              registredAddr = a;
            }
            allListeners[a] = listenerFunction;

            // });
          };



          const fetchFunction = (passedCB: (...args: any[]) => any) => {
            registerListener();
            if (clientSocket ) {
              clientSocket.emit(registredAddr, undefined, passedCB);
            }
          };

          const oldProp = Object.getOwnPropertyDescriptor(parent, k);
          if(oldProp){debugger;}
          Object.defineProperty(parent, k, {
            get: () => {return storedValue;},
            set: (v: any) => {

              registerListener();
              const hasChanged = !_.isEqual(v, storedValue);
              if (hasChanged) {// for array
                storedValue = v;
                const cb = parent.__remoteCBs[k];
                // debugger
                if (cb) {cb(parent, v); }
              }

              if (hasChanged && lockCallbacks === 0) {

                if(isClient){
                  if (clientSocket ) {
                    clientSocket.emit(registredAddr, v);
                  }
                }
                else{

                  broadcastMessageFromServerDebounced(registredAddr,v);

                }

              }
            },

            enumerable: true,
            configurable: true, // needs to be true to handle vue reactivity
          });


          defineObjTable(parent,'__fetch')[k] = fetchFunction;
          defineObjTable(parent,'__remoteValues')[k]= fetchFunction;
          defineObjTable(parent,'__registerListeners')[k] = registerListener
          defineObjTable(parent,'__remoteCBs')[k] = cb;
          return parent[k];
        });

  }
}

export function RemoteFunction (options?: {skipClientApply?: boolean, sharedFunction?: boolean}) {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {

    const method = descriptor.value;
    
    let registeredAddr = '';
    const fl = defineObjTable(target,'__registerFunctionListeners')[key] = true;//TODO
    const rf = defineObjTable(target,'__remoteFunctions')[key] = method
    descriptor.value = function(...args: any[]) { // need plain function for this

      // target.notifyRemote()
      let res: any;
      if (lockCallbacks === 0) {
        // call on remote
        if (clientSocket ) {

          const callF = (allowUnhooked: boolean) => {
            const pAddr =  buildAddressFromObj(this, !allowUnhooked);
            if (pAddr === null && allowUnhooked) {
              nextTick(() => callF(false));
              return;
            }
            const raddr = pAddr + '/' + key.toString();

            // @ts-igno
            if (registeredAddr !== raddr) {
              registeredAddr = raddr;
            }

            if(isClient){
              if ( AccessibleSettedByServer !== raddr  ) {
                // just check if we are not passing complex args as Vues
                const prunedArgs = args.map((e) => {
                  if(typeof(e)=='object'){
                    const c= Object.assign({}, e);
                    if(c.__ob__){
                      debugger;
                      delete c.__ob__;
                    }
                  }
                  else{return e;}
                });
                
                res = sendToSocketDebounced(registeredAddr, args);
              }
            }
            else{
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
    }
    
  }
}



export function nonEnumerable(opts?: {default?: any}) {
  return function(target: any, key: string | symbol)  {
    defineOnInstance(target,key,(ob,defaultValue)=>{
      const t = defineObjTable(ob,'__nonEnumerables')
      t[key]= true;
      let v = defaultValue;
      Object.defineProperty(ob, key, {
        get:()=>{return v },
        set:(nv)=>{v = nv},
        enumerable: false,
        configurable: false

      })
      return ob[key]
    })
  }
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

  let ob = parent.__registerFunctionListeners[k]
  if(ob===undefined){
    debugger
  }
  return ob


}
function initRemoteValue(parent: any, k: string) {
 
  let ob = parent.__registerListeners[k]
  if(ob===undefined){
    debugger
  }
  return ob

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

        super(...args);

        if (allAccessibles.has(this)) {
          debugger;
          console.error('recreating accessible');
        }
        allAccessibles.add(this);

        initAccessibles(this);
        initRemoteValues(this);
        //initRemoteFunctions(this);

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
      if(isClient){
        if(!accessibleParent.__ob__){
          debugger
        }
        if(!insp.__ob__){
         // debugger
       }
     }
     return {accessible: insp, parent: accessibleParent, key: inspA};
   }

 }
 console.error('can\'t find accessible for ', oriAddr, 'stopped at ', addr);
 return {accessible: undefined, parent: undefined};
}
