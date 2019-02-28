
type ChannelValueType = number; // |number[];

export interface ChannelI {
  ctype: string;
  name: string;
  value: ChannelValueType;
  enabled: boolean;

  setValue(v: ChannelValueType): boolean;
  setValueInternal(v: ChannelValueType): boolean;
}

export class ChannelBase implements ChannelI {
  public ctype = 'base';
  constructor(public name: string, public value: ChannelValueType = 0 , public enabled: boolean= true) {
  }
  public setValue(v: ChannelValueType) {
    this.value = v;
    return this.setValueInternal(v);
  }
  public setValueInternal(v: ChannelValueType) {return true; }
}



export class LogChannel extends ChannelBase {
  public ctype = 'logChanel';
  public setValueInternal( v: ChannelValueType) {
    console.log('set channel' + v);
    return true;
  }

}

