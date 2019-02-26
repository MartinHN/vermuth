


interface DimmerI {
  circ: number; // private
  value: number;
  setFloatValue(v: number): boolean;
  setValueInternal(c: number, v: number): boolean;


}

export class DimmerBase implements DimmerI {
  
  constructor(public circ: number= 0,public value:number = 0) {}

  public setFloatValue(v: number) {
    this.value = Math.floor(v*255);
    return this.setValueInternal(this.value);

  }
  public setValueInternal(v: number) {return true; }

}




//////////////
// LOG
/////////////////


export class LogDimmer extends DimmerBase {
  public setValueInternal( v: number) {
    console.log('dimmer ' + this.circ  + ' : ' + v);
    return true;
  }

  static fromObj(ob:any){
    return new LogDimmer(ob.circ,ob.value)
  }
}
