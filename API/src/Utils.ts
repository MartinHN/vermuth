export function uuidv4() {
  return 'xxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getNextUniqueName(nameList: string[], name: string): string {

  if (nameList.indexOf(name) === -1) {
    return name;
  }

  function joinNBI(nBase: string, pidx: number): string {
    return nBase.length ? nBase + ' ' + pidx : '' + pidx;
  }

  const nameSpl = name.split(' ');
  let idx = nameSpl.length > 0 ? parseInt(nameSpl[nameSpl.length - 1], 10) : NaN;
  if (isNaN(idx)) {idx = 0; nameSpl.push('0'); }

  idx += 1;
  const nameBase = nameSpl.slice(0, nameSpl.length - 1).join(' ');
  while ( (nameList.indexOf(joinNBI(nameBase, idx)) !== -1)) {
    idx += 1;

  }

  name = joinNBI(nameBase, idx);


  return name;

}

// function for dynamic sorting
export function compareValues(key: string, order= 'asc') {
  return (a: any, b: any) => {

    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = (typeof a[key] === 'string') ?
      a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string') ?
      b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}

export function arraysEqual(a:any[], b:any[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

