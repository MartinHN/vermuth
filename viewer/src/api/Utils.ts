
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



function componentToHex(c: number) {
  const hex = Math.floor(c).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}
