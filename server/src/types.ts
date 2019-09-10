// function ServerNameSpace<T extends {new(pname:string):{}}>(constructor:T) {
//     return class extends constructor {
//         namespaceName = pname
//         parameters = new [key:string]:any;
//         emit(v){

//         }

//     }
// }

// function SyncedValue(sname:string,get:Function,set:Function) {
//     proto.parameters[name] = {get,set}
//     return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//         descriptor.enumerable = value;
//     };
// }

// export function getter(n:string,v:any,callback:Function | undefined){
//   let vf = v;
//   if(typeof v!=='function'){
//     vf = ()=>{return v}
//   }
//   socket.on('GET_'+n,()=>{
//     const v = vf();
//     socket.emit('SET_'+n,v)
//     if(typeof callback ==='function'){
//       callback(v)
//     }
//   })
// }

// export function setter(n:string,vf:function){
//   socket.on('SET_'+n,vf);
// }
