

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
