const basicConstructor: {[id: string]: FixtureDef} = {};
const momoConstructor: { [id: string]: FixtureDef } = {};
import {FixtureDef} from '../FixtureFactory';

export async function initFactory(location= '') {

  basicConstructor.PAR =  new FixtureDef('PAR', ['PAR'], ['dim']);
  basicConstructor.RGB =  new FixtureDef('RGB', ['PAR'], ['dim','r','g','b'],{DimRGB:['dim','r','g','b'],RGB:['r','g','b'],RGBDim:['r','g','b','dim']});
  basicConstructor.RGBW =  new FixtureDef('RGBW', ['PAR'], ['dim','r','g','b','w'],{DimRGBW:['dim','r','g','b','w'],RGBW:['r','g','b','w'],RGBWDim:['r','g','b','w','dim']});

  return basicConstructor;
}
export async function initMomoFactory(location = '') {
  let fn = '20x10 LED WASH'
  let curFix = ['dim', 'shutter', 'r', 'g', 'b', 'w', 'amber', 'purple']
  momoConstructor[fn] = new FixtureDef(fn, ['PAR'], curFix, { normal: curFix });
  fn = 'SPECTRAL ZOOM M1500'
  curFix = ['dim', 'r', 'g', 'b', 'w', 'zoom', 'zoomReset']
  momoConstructor[fn] = new FixtureDef(fn, ['PAR'], curFix, { normal: curFix });
  fn = '44X4 CITY COLOR WASH'
  curFix = ['r', 'g', 'b', 'w']
  momoConstructor[fn] = new FixtureDef(fn, ['PAR'], curFix, { normal: curFix });
  fn = '48X10 STAGE FLOOD'
  curFix = ['red-1', 'green-1', 'blue-1', 'white-1', 'red-2', 'green-2', 'blue-2', 'white-2']
  momoConstructor[fn] = new FixtureDef(fn, ['PAR'], curFix, { normal: curFix });
  return momoConstructor;
}
