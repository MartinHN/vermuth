// {sourceChannels: [{type:'direct',name,value:0}], destDimmers: [0]}

import {ChannelBase, LogChannel } from './Channel';
import {DimmerBase, LogDimmer } from './Dimmer';

type ChannelValueType = ChannelBase['value'];

export class FixtureBase <C extends ChannelBase, D extends DimmerBase> {
  constructor(public ftype: string, public channel: C, public dimmers: D[], private DimmerClass: new (c: number) => D) {}

  public sendValue(v: ChannelValueType) {
    this.channel.setValue(v);
    this.toDimmers();
  }
  public toDimmers(): void {
    for (const d of this.dimmers) {
      d.setFloatValue(this.channel.value);
    }
  }

  public setDimmerNum(n: number, index: number) {this.dimmers[index].circ = n; } // vue events compatible


  
  public addDimmer(n: number): boolean {
    this.dimmers.push(new this.DimmerClass(n))
     return true;
  
      }
  public removeDimmer(index: number): boolean {
    if (index === undefined) {index = 0; }
    if (index >= 0 && index < this.dimmers.length) {
      this.dimmers.splice(index, 1);
      return true;
    }
    return false;

  }
  public clearDimmers() {
    this.dimmers = new Array<D>();
  }
}




export class DirectFixture extends FixtureBase<LogChannel, LogDimmer> {

  constructor( channelName: string,  dimmerCircs: number[] ) {
      super('direct', new LogChannel(channelName), [], LogDimmer);
      dimmerCircs.map((d) => this.addDimmer(d));
     }

     static fromObj(ob:any):DirectFixture{
      let res =   new DirectFixture(ob.channel.name,ob.dimmers.map((d:any)=>d.circ))
      res.channel.enabled = ob.channel.enabled;
      res.channel.value = ob.channel.value;
      return res;
     }

}




