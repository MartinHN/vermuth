
const isClient = process.env.VUE_APP_ISCLIENT;
// console.log("process env",process.env) // totaly unsafe code but well...
function getVue() {
  if (!isClient) {return false; }
  try {
    return require( 'vue').default;
  } catch (e) {}
  return false;
}


export function deleteProp(o: any, p: string|symbol) {
  if (o[p] && o[p].__dispose) {
    o[p].__dispose();
  }
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.delete(o, p);
  } 
  else {
    Reflect.deleteProperty(o, p);
  }
}


export function addProp(o: any, p: string|symbol, v: any) {
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.set(o, p, v);
  } 
  else {
    Reflect.set(o, p, v);
  }
}


export function nextTick(cb: any) {
  const Vue = getVue();
  if (Vue) {
    Vue.nextTick(cb);
  } else {
    // @ts-ignore
    process.nextTick(cb);
  }
}
