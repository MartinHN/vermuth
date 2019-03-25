// {sourceChannels: [{type:'direct',name,value:0}], destDimmers: [0]}

import {ChannelBase } from './Channel';
import {DimmerBase, LogDimmer } from './Dimmer';

// const EventEmitter = require('events').EventEmitter;
type ChannelValueType = ChannelBase['value'];
interface FixtureBaseI {
  name: string;
}
type FixtureConstructorI  = (...args: any[]) => FixtureBase;
const fixtureTypes: {[key: string]: FixtureConstructorI} = {};

export class FixtureBase implements FixtureBaseI {
  public static fromObj(ob: any): FixtureBase |undefined {
    if (ob.channels) {
      const cstr = fixtureTypes[ob.ftype];
      if (cstr) {
        const i = cstr(ob.name, []);
        i.channels =   ob.channels.map((c: any) => ChannelBase.fromObj(c));
        return i;
      } else {
        return undefined;
      }
    }
  }

  protected ftype = 'base';


  constructor(public name: string, public channels: ChannelBase[]) {}

  public sendValue(v: ChannelValueType) {
    for (const c of this.channels) {
      c.setValue(v);
    }
  }

  public addChannel(c: ChannelBase|undefined) {
    if (c === undefined) {
      c = new ChannelBase('channel', 0, [], true);
    }
    this.channels.push(c);
  }


  public getChannelForName(n: string) {
    return this.channels.find((c) => c.name === n);
  }
  public getAllDimmers() {
    return this.channels.map((c) => c.dimmers).flat();
  }



}


export class DirectFixture extends FixtureBase {

  constructor( channelName: string,  dimmerCircs: number[] ) {
    super(channelName, [new ChannelBase('channel', 0, dimmerCircs)]);
    this.ftype = 'direct';

  }

}
fixtureTypes.direct = (...args: any[]) => new DirectFixture(args[0], args[1]);




const  allDimmers  = new Array(512).fill(0).map((_, idx) => idx);
export const fixtureAll = new DirectFixture('all', allDimmers);



