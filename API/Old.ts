
// function ParameterContainer<T extends {new(...args:any[]):{}}>(_name:string){

//   return function <T extends {new(...args:any[]):{}}>(constructor:T) {
//     console.log('eval const')
//     return class extends constructor {




//   }

// }
// function  _Parameter(){
//   return function(target: any, key: string) {
//     console.log('t',S(target))
//     console.log('p',key)

//     let val = target[key];
//     if(!target.staticParameters){
//       Object.defineProperty(target, "staticParameters", {
//       value:{},
//       enumerable: true,
//       configurable: true,
//       writable: true,
//     });
//     }
//     target.staticParameters[key] = target[key]
//     const getter = () =>  {
//       return val;
//     };
//     const setter = (next) => {
//       console.log('updating param...',next);
//       val = `🍦 ${next} 🍦`;
//     };


//     Object.defineProperty(target, key, {
//       get: getter,
//       set: setter,
//       enumerable: true,
//       configurable: true,
//       // writable: true,
//     });
    
//   }
// }

// @ParameterContainer("lala")