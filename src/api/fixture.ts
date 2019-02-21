// {sourceChannels: [{type:'direct',name,value:0}], destDimmers: [0]}

import {ChannelBase, LogChannel } from './Channel';
import {DimmerBase, LogDimmer } from './Dimmer';

type ChannelValueType = ChannelBase['value'];

export class FixtureBase <C extends ChannelBase, D extends DimmerBase> {
  constructor(public ftype: string, public channel: C, public dimmer: D) {}

  public sendValue(v: ChannelValueType) {
    this.channel.setValue(v);
    this.toDimmer();
  }
  public toDimmer(): void {
    this.dimmer.setValue(this.channel.value);
  }
}




export class DirectFixture extends FixtureBase<LogChannel, LogDimmer> {
  constructor( channelName: string,  dimmerCircs: number[] ) {super('direct', new LogChannel(channelName), new LogDimmer(dimmerCircs)); }

}




