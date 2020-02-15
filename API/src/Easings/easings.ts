import bezier from 'bezier-easing';

export interface Easing {

  compute(a: number, b: number, pct: number): number;
  configureFromObj(o: any): void;
  toObj(): any;
}

type EasingConstructorI  = (...args: any[]) => Easing;
interface TypedClass {
  typeName: string;
  new (): Easing;
}
export class EasingFactory {
  public static  easingTypes: {[key: string]: EasingConstructorI} = {};
  public static createFromObj(ob: any): Easing |undefined {
    const cstr = EasingFactory.easingTypes[ob.etype];
    if (cstr) {
      const i = cstr();
      i.configureFromObj(ob);

      return i;
    } else {
      return undefined;
    }
  }

  public static addTypeInfo(o: any) {
    o.etype = o.constructor.typeName;
    return o;
  }
  public static registerClass<T extends TypedClass>(c: T) {
    EasingFactory.easingTypes[c.typeName] = (...args: any[]) => new c();
  }
  public static createNextEasing(e: Easing) {
    const tn = (e.constructor as TypedClass).typeName;
    const easingNames = Object.keys(EasingFactory.easingTypes);
    let idx  = easingNames.indexOf(tn);
    if (idx >= 0) {
      idx = (idx + 1) % (easingNames.length);
      const other = EasingFactory.easingTypes[easingNames[idx]];
      return other();
    } else {
      debugger;
      console.error('no easing found');
      return new LinearEasing();
    }

  }
}






export class LinearEasing implements Easing {
  public static typeName = 'l';
  public compute(a: number, b: number, pct: number) {return a + (b - a) * pct; }
  public configureFromObj(o: any) {}
  public toObj(): any {
    return EasingFactory.addTypeInfo(this);
  }
}
EasingFactory.registerClass(LinearEasing);

export class BezierEasing implements Easing {
  public static typeName = 'bz';
  private lastDiff = 0;
  private bezier: bezier.EasingFunction = bezier(0, 0, 0, 0);
  private dxa = 1;
  private dxb = 0.01;
  private dya = 0;
  private dyb = 0.9;

  constructor() {
    this.setNormHandles(this.dxa, this.dya, this.dxb, this.dyb);
  }
  public compute(a: number, b: number, pct: number) {
    const normed = this.bezier(pct);
    return a + normed * (b - a);

  }

  public getPA(ax: number, ay: number, bx: number, by: number) {
    return [ax + (bx - ax) * this.dxa, ay + (by - ay) * this.dya];
  }
  public getPB(ax: number, ay: number, bx: number, by: number) {
    return [ax + (bx - ax) * this.dxb, ay + (by - ay) * this.dyb];
  }

  public setAHandle(dxa: number, dya: number) {
    this.setNormHandles(dxa, dya, this.dxb, this.dyb);
  }
  public setBHandle(dxb: number, dyb: number) {
    this.setNormHandles(this.dxa, this.dya, dxb, dyb);
  }

  public setNormHandles(dxa: number, dya: number, dxb: number, dyb: number) {
    this.dxa = dxa;
    this.dxb = dxb;
    this.dya = dya;
    this.dyb = dyb;
    this.bezier = bezier(dxa, dya, dxb, dyb);
    return this;
  }
  public configureFromObj(o: any) {this.setNormHandles(o.dxa || 0, o.dya || 0, o.dxb || 0, o.dyb || 0); }
  public toObj(): any {return EasingFactory.addTypeInfo(this); }
}
EasingFactory.registerClass(BezierEasing);

console.log(EasingFactory.easingTypes);
