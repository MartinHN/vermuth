
type ChannelValueType = number; // |number[];

export interface ChannelI {
  ctype: string;
  name: string;
  value: ChannelValueType;

  setValue(v: ChannelValueType): boolean;
  setValueInternal(v: ChannelValueType): boolean;
}

export class ChannelBase implements ChannelI {
  public ctype = 'base';
  constructor(public name: string, public value: ChannelValueType = 0 ) {}
  public setValue(v: number) {
    this.value = v;
    return this.setValueInternal(v);
  }
  public setValueInternal(v: number) {return true; }
}



export class LogChannel extends ChannelBase {
  public ctype = 'logChanel';
  public setValueInternal( v: ChannelValueType) {
    console.log('set channel' + v);
    return true;
  }

}

