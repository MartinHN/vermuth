const isClient = process.env.VUE_APP_ISCLIENT;
let clientSocket: any = null ;
// let ioServer: any = null;
const listenedNodes: {[id: string]: any} = {};
import {addProp} from './MemoryUtils';
let allListeners: {[id: string]: Function} = {};
let AccessibleSettedByServer :any = null;

export function bindClientSocket(s: any) {

  safeBindSocket(s);
}

function safeBindSocket(s: any) {
  if (clientSocket !== null && s!=="auto") {console.error('reassigning socket'); }
  // debugger;
  const f = (o: any) => {
    if (o.__accessibleMembers) {
      for (const k in o.__accessibleMembers) {
        f(o[k]);
      }
    }
    const remotesV = initRemoteValues(o);
    // remotesV.map(f=>f())
    const remotesF = initRemoteFunctions(o);
    // remotesF.map(f=>f())
    
    // initRemoteFunction(o)
  };
  allListeners = {};
  if(s!=="auto"){clientSocket = s;}
  const rS = require('./RootState').default;
  f(rS);
  console.log('listen to messages' ,allListeners)
  
}

function buildAddressFromObj(o: any) {
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
    throw new Error('can\'t find address on object' + o);
    return '';
  }

}




export function RemoteFunction(options?: {skipClientApply?: boolean}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    if (target.__remoteFunctions===undefined) {
      Object.defineProperty(target, '__remoteFunctions', {
        value: {},
        enumerable: false,
        configurable: false,
        writable: true,
      });
    }
    target.__remoteFunctions[propertyKey] = method;
    // }
    descriptor.value = function(...args: any[]) {
      // target.notifyRemote()
      let res: any;
      if (AccessibleSettedByServer!==target[propertyKey]) {
        if (clientSocket) {
          const addr = buildAddressFromObj(this) + '/' + propertyKey;
          res = clientSocket.emit(addr, args);
        } else {
          console.error('can\'t reach server on RemoteFunction : ', propertyKey);
        }
      }
      else{
        
        console.error("avoid feedback");
      }

      if (!options || !(isClient && options.skipClientApply) ) {
        // debugger
        res = method.call(this,...args);
      }

      return res;
    };
  };
}



export function SetAccessible() {

  return function(target: any, key: string | symbol) {
    const val = target[key];
    if (target.__accessibleMembers===undefined) {
      Object.defineProperty(target, '__accessibleMembers', {
        value:{},
        enumerable: false,
        configurable: false,
        writable:true,
      });
    }

    target.__accessibleMembers[key] = val;


  };
}



export function RemoteValue(cb?: Function) {

  return function(target: any, key: string | symbol) {
    const val = target[key];
    if (target.__remoteValues===undefined) {
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
    } else if (target.__remoteCBs===undefined) {
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
  const res = []
  if (parent.__remoteValues) {
    for (const k in parent.__remoteValues) {
      res.push(initRemoteValue(parent, k));
    }
  }
  return res
}
function initRemoteFunctions(parent:any){
  const res = []
  if (parent.__remoteFunctions) {
    for (const k in parent.__remoteFunctions) {
      res.push(initRemoteFunction(parent, k));
    }
  }
  return res;
}
function initRemoteFunction(parent:any,k:string){

  if(parent.__initRemoteFunctionClosures===undefined){
    Object.defineProperty(parent,'__initRemoteFunctionClosures',{
      value : {},
      writable:true,
      enumerable:false,
      configurable:false
    })
    
  }
  if (parent.__initRemoteFunctionClosures[k]===undefined){
    let registredAddr = '';
    let registeredClientSocket:any = null
    const method  =parent[k];
    const listenerFunction = (args:any[])=>{ // socket io send arg as array dont rest out
      AccessibleSettedByServer = parent[k]
      method.call(parent,...args);
      AccessibleSettedByServer = null
    }
    parent.__initRemoteFunctionClosures[k]  = () => {
      const a = buildAddressFromObj(parent) + '/' + k;
      if (registredAddr !== a || clientSocket!==registeredClientSocket) {
        if(clientSocket){
          clientSocket.removeListener(registredAddr,listenerFunction);
          clientSocket.on(a, listenerFunction);
          registeredClientSocket = clientSocket
        }
        registredAddr = a;

        delete allListeners[registredAddr];
        allListeners[a] = listenerFunction;
      }

    };


  }
  return parent.__initRemoteFunctionClosures[k]

}
function initRemoteValue(parent: any, k: string) {
  // if (isClient) {
    if(!parent.initValueClosures){
      Object.defineProperty(parent,'initValueClosures',
        {value:{},
        writable :true,
        enumerable:false,
        configurable:false})
    }
    if(!parent.initValueClosures[k]){
      let storedValue: any = parent[k];

      let emiting = false;
      let registredAddr = '';
      let registeredClientSocket = {}
      const listenerFunction = (msg: any) => {
        if (!emiting) {
          storedValue = msg;
          AccessibleSettedByServer = storedValue;
          // addProp(parent,k,msg);
          parent[k] = msg;
          AccessibleSettedByServer = null;
        }
      };
      const registerListener = () => {
        const a = buildAddressFromObj(parent) + '/' + k;
        if (registredAddr !== a || clientSocket!==registeredClientSocket) {
          if(clientSocket){
            clientSocket.removeListener(registredAddr, listenerFunction);
            clientSocket.on(a, listenerFunction);
            registeredClientSocket = clientSocket
          }
          registredAddr = a;
          delete allListeners[registredAddr];
          allListeners[a] = listenerFunction;
        }

      };
      const getter = () => {
        return storedValue;
      };
      const fetchFunction = (cb: Function) => {


        // listenedNodes[addr] = true
        registerListener();
        if (clientSocket) {
          emiting = true;
          clientSocket.emit(registredAddr, undefined, cb);
          emiting = false;



        }
      };
      const setter = (v: any) => {


        registerListener();
        if (clientSocket) {
          // listenedNodes[addr] = true
          // debugger

          if (v != storedValue) {
            storedValue = v;
            const cb = parent.__remoteCBs[k];
            // debugger
            if (cb) {cb(parent, v); }

            emiting = true;
            clientSocket.emit(registredAddr, v);
            emiting = false;
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
      parent.initValueClosures[k] = registerListener

    }
    
    return parent.initValueClosures[k]
    // } else {
      //   let storedValue = parent[k]
      //   const setter =(v:any)=> {
        //     if(v===storedValue){return}
        //     storedValue = v

        //     if(ioServer){
          //       ioServer.broadcast()
          //     }

          //   }
          //   const getter=()=> {
            //     return storedValue
            //   }

            //   Object.defineProperty(parent, k, {
              //     get: getter,
              //     set: setter,
              //     enumerable: true,
              //     configurable: true,
              //   });

              // }

            }

            export function setChildAccessible(parent: any, k: string|symbol) {
              // if (!parent[k].__accessibleParent) {
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
                if(parent.__accessibleMembers===undefined){
                  Object.defineProperty(parent, '__accessibleMembers', {
                    value:{},
                    enumerable: false,
                    configurable: false,
                    writable: true
                  });

                }

                parent.__accessibleMembers[k] = parent[k] || parent.__accessibleMembers[k]

                // } else {
                  //   parent[k].__accessibleParent = parent;
                  //   parent[k].__accessibleName = k;
                  // }

                }



                const allAccessibles = new Set<any>();
                export function AccessibleClass<T extends new(...args: any[]) => {}>() {
                  return function<T extends new(...args: any[]) => {}>(constructor: T) {
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
                      }

                      public __dispose() {
                        allAccessibles.delete(this);
                      }




                    };
                  };
                }

                export function fetchRemote(o: any, k: string, cb?: Function) {
                  if (o.__remoteValues!==undefined && o.__remoteValues[k]) {
                    o.__remoteValues[k](cb);
                  }
                }

                export function nonEnumerable() {
                  return function(target: any, key: string | symbol) {
                    let val = target[key];
                    Object.defineProperty(target, key, {
                      get: () => val ,
                      set: (v: any) => {val = v; },
                      enumerable: false,
                      configurable: false,
                      // writable: true,
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
