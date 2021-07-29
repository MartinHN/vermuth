const basicConstructor: {[id: string]: FixtureDef} = {};
import {FixtureDef} from '../FixtureFactory';

export async function initFactory(location= '') {

  basicConstructor.PAR =  new FixtureDef('PAR', ['PAR'], ['dim']);
  basicConstructor.RGB =  new FixtureDef('RGB', ['PAR'], ['dim','r','g','b'],{DimRGB:['dim','r','g','b'],RGB:['r','g','b'],RGBDim:['r','g','b','dim']});
  basicConstructor.RGBW =  new FixtureDef('RGBW', ['PAR'], ['dim','r','g','b','w'],{DimRGBW:['dim','r','g','b','w'],RGBW:['r','g','b','w'],RGBWDim:['r','g','b','w','dim']});

  return basicConstructor;
}
