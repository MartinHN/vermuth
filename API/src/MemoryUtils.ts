// #if IS_CLIENT
const isClient = true;
// #else
const isClient = process.env.VUE_APP_ISCLIENT;
// #endif


function getVue() {
  
  if (!isClient) {return false; }

  try {
    // #if IS_CLIENT
    return require( 'vue').default;
    // #endif
  } catch (e) {}
  return false;
}


export function deleteProp(o: any, p: string|symbol) {
  if (o[p] && o[p].__dispose) {
    o[p].__dispose();
  }
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.delete(o, p);
    return
  } 
  else {throw "client can't access vue"}
  // #else
  
  
    Reflect.deleteProperty(o, p);
  
  // #endif
}


export function addProp(o: any, p: string|symbol, v: any) {
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.set(o, p, v);
    return
  } else {throw "client can't access vue"}
  // #else
    Reflect.set(o, p, v);
  // #endif
}


export function nextTick(cb: any) {
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue) {
    Vue.nextTick(cb);
    return
  } else {throw "client can't access vue"}
  // #else
  
    // @ts-ignore
    process.nextTick(cb);
  
  // #endif
}
