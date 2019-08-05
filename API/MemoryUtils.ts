
const isClient = process.env.VUE_APP_ISCLIENT
function getVue(){
  if(!isClient){return false;}
  try{
    return require( 'vue').default;
  }
  catch (e){}
  return false
}


export function deleteProp(o:any,p:string){
  if(o.__dispose){
    o.__dispose();
  }
  const Vue = getVue()
  if(Vue){
    Vue.delete(o,p)
  }
  else{
    delete o[p]
  }
}


export function addProp(o:any,p:string,v:any){
  const Vue = getVue()
  if(Vue){
    Vue.set(o,p,v)
  }
  else{
    o[p] = v
  }
}
