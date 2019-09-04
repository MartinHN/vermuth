
const isClient = process.env.VUE_APP_ISCLIENT;
// console.log("process env",process.env) // totaly unsafe code but well...
function getVue() {
  if (!isClient) {return false; }
  try {
    return require( 'vue').default;
  } catch (e) {}
  return false;
}


export function deleteProp(o: any, p: string) {
  if (o[p] && o[p].__dispose) {
    o[p].__dispose();
  }
  const Vue = getVue();
  if (Vue) {
    Vue.delete(o, p);
  } else {
    delete o[p];
  }
}


export function addProp(o: any, p: string, v: any) {
  const Vue = getVue();
  if (Vue) {
    Vue.set(o, p, v);
  } else {
    o[p] = v;
  }
}


export function nextTick(cb:any){
  const Vue = getVue();
  if (Vue) {
    Vue.nextTick(cb)
  }
  else{
    process.nextTick(cb)
  }
}