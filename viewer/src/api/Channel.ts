import { DimmerBase } from './Dimmer';

type ChannelValueType = number; // |number[];

export interface ChannelI {
  ctype: string;
  name: string;
  value: ChannelValueType;
  enabled: boolean;
  dimmers: DimmerBase[];

  setValue(v: ChannelValueType): boolean;
  setValueInternal(v: ChannelValueType): boolean;
}



type ChannelConstructorI  = new (...args: any[]) => ChannelI;


const channelTypes: {[key: string]: ChannelConstructorI} = {};

export class ChannelBase implements ChannelI {

  public static fromObj(ob: any): ChannelI|undefined {
    const cstr = channelTypes[ob.ctype];
    if (cstr) {
      return new cstr(ob.name, ob.value, ob.dimmers.map((d: any) => d.circ));
    } else {
      return undefined;
    }

  }
  public ctype = 'base';
  public dimmers: DimmerBase[] = [];
  constructor(public name: string, public value: ChannelValueType = 0 , dimmerCircs: number[]= [], public enabled: boolean= true) {
    for (const d of dimmerCircs) {
      this.dimmers.push(new DimmerBase(d));
    }
  }
  public setValue(v: ChannelValueType) {
    this.value = v;
    for (const d of this.dimmers) {
      d.setFloatValue(this.value);
    }
    return this.setValueInternal(v);
  }

  public setDimmerNum(n: number, index: number) {this.dimmers[index].circ = n; } // vue events compatible

  public addDimmer(n: number): boolean {
    this.dimmers.push(new DimmerBase(n));
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
    this.dimmers = new Array<DimmerBase>();
  }

  public setValueInternal(v: ChannelValueType) {return true; }


}
// register type
channelTypes.base =  ChannelBase.prototype.constructor as new (...args: any[]) => ChannelBase;


export class LogChannel extends ChannelBase {
  public ctype = 'logChanel';
  public setValueInternal( v: ChannelValueType) {
    console.log('set channel' + v);
    return true;
  }

}


// const  allDimmers  = new Array(512).fill(0).map((_, idx) => idx);
// export const channelAll = new ChannelBase('all', 0, allDimmers, true);
