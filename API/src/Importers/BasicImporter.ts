const basicConstructor: {[id: string]: FixtureDef} = {};
import {FixtureDef} from '../FixtureFactory';

export async function initFactory(location= '') {

  basicConstructor.PAR =  new FixtureDef('PAR', ['PAR'], ['dim']);

  return basicConstructor;
}
