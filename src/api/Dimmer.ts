


interface DimmerI {
  circs: number[]; // private
  value: number;
  setValue(v: number): boolean;
  setValueInternal(c: number, v: number): boolean;
  setDimmerNum(v: number, index: number): void;
  addDimmer(v: number): boolean;
  removeDimmer(index: number): boolean;
  clearDimmers(): void;

}

export class DimmerBase implements DimmerI {
  public value = 0;
  constructor(public circs: number[]) {}

  public setValue(v: number) {
    this.value = v;
    let res = this.circs.length > 0;
    for (const c of this.circs) {
      res = res && this.setValueInternal(c, v);
    }
    return res;
  }
  public setValueInternal(c: number, v: number) {return true; }
  public setDimmerNum(n: number, index: number) {this.circs.splice(index, 1, n); } // vue events compatible

  public addDimmer(v: number): boolean {this.circs.push(v); return true; }
  public removeDimmer(index: number): boolean {
    if (index === undefined) {index = 0; }
    if (index >= 0 && index < this.circs.length) {
      this.circs.splice(index, 1);
      return true;
    }
    return false;

  }
  public clearDimmers() {
    this.circs = new Array<number>();
  }
}




//////////////
// LOG
/////////////////


export class LogDimmer extends DimmerBase {
  public setValueInternal(c: number, v: number) {
    console.log('dimmer ' + c + ' : ' + v);
    return true;
  }
}
