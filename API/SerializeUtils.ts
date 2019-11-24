export function buildEscapedJSON(content: any, indent?: number) {
  function filterPrivate(key: string, value: any) {
    if (key.startsWith('__')) {
      // console.log('ignoring', key);
      return undefined;
    } else { return value; }

  }
  return JSON.stringify(content, filterPrivate, indent);
}

export function buildEscapedObject(content: any, indent?: number) {
  return JSON.parse(buildEscapedJSON(content));
}

export const jsonPreHook=(o:any,pre:()=>void)=>{
  const hook = ()=>{pre();return o;}
  o.toJSON = hook
}

export function getCircular(o: any) {
  const obCache: any[] = [];
  const leafCache: any[] =  [];
  const r = (value: any) => {
    if (value === null) {return; }
    if (typeof value === 'object' ) {
      if (obCache.indexOf(value) !== -1) {
        // Duplicate reference found, discard key
        debugger;
        return;
      }
      // Store value in our collection
      obCache.push(value);
      Object.values(value).map((vv) => r(vv));
    } else {
      leafCache.push(value);
    }

  };
  r(o);
  debugger;
  return obCache.length + leafCache.length;
}
