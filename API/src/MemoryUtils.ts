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
  } catch (e) {
    throw new Error('can\'t require Vue');
  }
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
    return;
  }
  // #endif
  Reflect.deleteProperty(o, p);

}


export function addProp(o: any, p: string|symbol, v: any) {
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue && !Array.isArray(o)) {
    Vue.set(o, p, v);
    return;
  }
  // #endif
  Reflect.set(o, p, v);

}


export function nextTick(cb: any) {
  // #if IS_CLIENT
  const Vue = getVue();
  if (Vue) {
    Vue.nextTick(cb);
    return;
  }
  // #endif

    // @ts-ignore
  process.nextTick(cb);


}
