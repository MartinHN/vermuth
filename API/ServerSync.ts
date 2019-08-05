const isClient = process.env.VUE_APP_ISCLIENT
let clientSocket:any=null ;

let listenedNodes : {[id:string]:any} = {}

export function bindClientSocket(s:any){
  if(!isClient){throw " can't bind client socket on server";}
  if(clientSocket!==null){console.error("reassigning socket");}
  clientSocket = s;
}

function buildAddressFromObj(o:any){
  let insp = o;
  let addr = []
  let found;
  while(insp && !insp.__isRoot){
    found = false;
    if(insp.__accessibleName){
      addr.push(insp.__accessibleName)
      found = true
    }
    else if(Array.isArray(insp.__accessibleParent)){
      addr.push(""+insp.__accessibleParent.indexOf(insp))
      found = true
    }
    else if (insp.__accessibleParent) {
      const pair = Object.entries(insp.__accessibleParent).find(([k,v])=>v===insp);
      if(pair){
        addr.push(pair[0])
        found = true
      }
      else{
        debugger
        console.error("not found")
      }

    }
    
    insp = insp.__accessibleParent
  }
  if(addr && addr.length){
    addr = addr.reverse()
    return "/"+addr.join("/")
  }
  else if(insp.__isRoot){
    return ""
  }
  else{
    throw "can't find address on object"+o;
    return "";
  }

}




export function RemoteFunction(options?:{skipLocal?:boolean}){
  return function (target:any, propertyKey: string, descriptor: PropertyDescriptor) {
    let method = descriptor.value;
    if(!isClient){
      if(!target.__remoteFunctions){
        target.__remoteFunctions = {}
      }
      target.__remoteFunctions[propertyKey] = method
    }
    descriptor.value = function (...args:any[]) {
      // target.notifyRemote()
      let res:any;
      if(isClient){
        if(clientSocket){
          const addr = buildAddressFromObj(this)+"/"+propertyKey;
          res = clientSocket.emit(addr,args)
        }
        else{
          console.error("can't reach server on RemoteFunction : ",propertyKey)
        }
      }

      if(!options || !options.skipLocal){
        res = method.apply(this, args)
      }
      
      return res
    }
  }
}



export function SetAccessible(){

  return function (target:any, key: string | symbol) {
    let val = target[key]
    if(!target.__accessibleMembers){
      Object.defineProperty(target, "__accessibleMembers", {
        value:{},
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }


    target.__accessibleMembers[key] = val


  }
}

export function RemoteValue(){

  return function (target:any, key: string | symbol) {
    let val = target[key]
    if(!target.__remoteValues){
      Object.defineProperty(target, "__remoteValues", {
        value:{},
        enumerable: false,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(target, "fetch", {
        get:()=>{return target.__remoteValues},
        enumerable: false,
        configurable: false,
      });
    }
    target.__remoteValues[key] = val


  }
}


function initAccessibles(parent:any){
  if(parent.__accessibleMembers){
    for(const k of Object.keys(parent.__accessibleMembers)){
      setChildAccessible(parent,k)
    }
  }
}
function initRemoteValues(parent:any){
  if(parent.__remoteValues){
    for(const k of Object.keys(parent.__remoteValues)){
      initRemoteValue(parent,k)
    }
  }
}

function initRemoteValue(parent:any,k:string){
  if(isClient){
    let storedValue:any = parent[k]
    let settingFromServer = false
    let emiting = false
    let registredAddr = ""
    let listenerFunction = (msg:any)=>{
      if(!emiting){
        storedValue = msg;
        settingFromServer = true
        parent[k] = msg;
        settingFromServer = false
      }
    }
    function registerListener(a:string){
      if(registredAddr!==a){
        clientSocket.removeListener(registredAddr,listenerFunction)
        clientSocket.on(a,listenerFunction)
        registredAddr = a
      }
    }
    let getter = ()=>{
      return storedValue;
    }
    let fetchFunction = (cb:Function)=>{
      if(clientSocket){
        const addr = buildAddressFromObj(parent)+"/"+k;
        // listenedNodes[addr] = true
        registerListener(addr)
        emiting = true
        clientSocket.emit(addr,undefined,cb);
        emiting = false
        
        

      }
    }
    let setter = (v:any)=>{
      if(clientSocket){
        const addr = buildAddressFromObj(parent)+"/"+k;
        // listenedNodes[addr] = true
        //debugger
        if(v!=storedValue){
          registerListener(addr)
          emiting = true
          clientSocket.emit(addr,v);
          emiting = false
        }

      }
    }
    Object.defineProperty(parent, k, {
      get:getter,
      set:setter,
      enumerable: true,
      configurable: true,
    });

    parent.__remoteValues[k] = fetchFunction

  }

}

export function setChildAccessible(parent:any,k:string|symbol){
  if(!parent[k].__accessibleParent){
    Object.defineProperty(parent[k], "__accessibleParent", {
      value:parent,
      enumerable: false,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(parent[k], "__accessibleName", {
      value:k,
      enumerable: false,
      configurable: true,
      writable: true,
    });

  }
  else{
    parent[k].__accessibleParent = parent
    parent[k].__accessibleName = k
  }

}


export function AccessibleClass<T extends {new(...args:any[]):{}}>(){
  return function<T extends {new(...args:any[]):{}}>(constructor:T) {
    return class extends constructor {
      constructor(...args:any[]){
        // if(args.length==2 && !args[1].length){
        //   args=args[0]
        //   }
        // if(!args.length){super();}
        // else if(!Array.isArray(args)){super(args);}
        // else if(args.length==1 ){super(args[0]);}
        // else if(args.length==2){super(args[0],args[1]);}
        // else if(args.length==3){super(args[0],args[1],args[2]);}
        // else if(args.length==4){super(args[0],args[1],args[2],args[3]);}
        // else if(args.length==5){super(args[0],args[1],args[2],args[3],args[4]);}
        // else if(args.length==6){super(args[0],args[1],args[2],args[3],args[4],args[5]);}
        // else{
        //   debugger
        //   console.error("too many args in constructor, trying spread op")
          super(...args) // not working properly in chrome...
        // }
        
        initAccessibles(this)
        initRemoteValues(this)
      }

    }
  }
}

export function resolveAccessible(parent:any , addr:string[]){
  const oriAddr = addr.slice();
  let inspA = addr.shift()
  if(inspA){

    let insp = parent[inspA];
    let accessibleParent = insp;
    while(insp && addr.length){
      inspA = addr.shift()
      accessibleParent = insp
      if(inspA){insp = insp[inspA];}
      else{break;}
    }
    if(addr.length===0){
      return {accessible:insp,parent:accessibleParent}
    }

  }
  console.error("can't find accessible for ",oriAddr,"stopped at ",addr)
  return {accessible:undefined,parent:undefined}
}