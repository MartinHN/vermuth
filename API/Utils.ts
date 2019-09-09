
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

