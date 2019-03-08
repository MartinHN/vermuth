


interface DimmerI {
  circ: number; // private
  __value: number;
  setFloatValue(v: number): boolean;
  setValueInternal(c: number, v: number): boolean;


}

class UniverseListenerClass {
  public setListener(f: (c: number, v: number) => void) {
    this.listener = f;
  }
  public notify(c: number, v: number) {
      this.listener(c, v);

  }
  private listener: (c: number, v: number) => void = () => {};
}

export const UniverseListener = new UniverseListenerClass();

export class DimmerBase implements DimmerI {

  constructor(public circ: number= 0, public __value: number = 0) {}

  public setFloatValue(v: number) {
    return this.setIntValue( Math.floor(v * 255));

  }

  public setIntValue(nvalue: number) {
    if (nvalue !== this.__value) {
      this.__value = nvalue;
      UniverseListener.notify(this.circ, this.__value);
      return this.setValueInternal(this.__value);
    } else {
      return false;
    }
  }

  public setValueInternal(v: number) {return true; }

}




//////////////
// LOG
/////////////////


export class LogDimmer extends DimmerBase {

  public static fromObj(ob: any) {
    return new LogDimmer(ob.circ, ob.value);
  }
  public setValueInternal( v: number) {
    console.log('dimmer ' + this.circ  + ' : ' + v);
    return true;
  }
}
