

export function Settable() {
  return(target: any, key: string) => {
    const module = target.constructor as any; // Mod<T, any>
    if (!module.mutations) {module.mutations = {}; }
    const mutation = (state: any, payload: any) => {
      state[key] = payload;
    };
    const mutName = 'set__' + key;
    module.mutations![mutName] = mutation;
  };
}


export function downloadObjectAsJSON(exportString: string, exportName: string) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportString);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href',     dataStr);
    downloadAnchorNode.setAttribute('download', exportName + '.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
