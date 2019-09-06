
function componentToHex(c: number) {
  const hex = Math.floor(c).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function hexToRgb(hex: string, normalize: boolean = false) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const normF = normalize ? 255 : 1;
  return result ? {
    r: parseInt(result[1], 16) / normF,
    g: parseInt(result[2], 16) / normF,
    b: parseInt(result[3], 16) / normF,
  } : null;
}
