export class Point {

  constructor(public x: number= 0, public y: number= 0) {}
  public distSq(b: Point | Rect) {
    return (this.x - b.x) * (this.x - b.x) + (this.y - b.y) * (this.y - b.y);

  }
  public dist( b: Point) {
    return Math.sqrt(this.distSq( b));
  }

  public addS(a:number):Point{this.x+=a;this.y+=a;return this;}
  public add(v:Point):Point{this.x+=v.x;this.y+=v.y;return this;}
  public caddS(v:number):Point{const p = this.clone();return p.addS(v);}
  public cadd(v:Point):Point{const p = this.clone();return p.add(v);}

  public subS(a:number):Point{this.x-=a;this.y-=a;return this;}
  public sub(v:Point):Point{this.x-=v.x;this.y-=v.y;return this;}
  public csubS(v:number):Point{const p = this.clone();return p.subS(v);}
  public csub(v:Point):Point{const p = this.clone();return p.sub(v);}

  public multS(a:number):Point{this.x*=a;this.y*=a;return this;}
  public mult(v:Point):Point{this.x*=v.x;this.y*=v.y;return this;}
  public cmultS(v:number):Point{const p = this.clone();return p.multS(v);}
  public cmult(v:Point):Point{const p = this.clone();return p.mult(v);}


  public divS(a:number):Point{this.x/=a;this.y/=a;return this;}
  public div(v:Point):Point{this.x/=v.x;this.y/=v.y;return this;}
  public cdivS(v:number):Point{const p = this.clone();return p.divS(v);}
  public cdiv(v:Point):Point{const p = this.clone();return p.div(v);}

  public clone():Point{return new Point(this.x,this.y)}

}


export class Size {

  constructor(public w: number= 0, public h: number= 0) {}

  public inv() {return {w: 1 / Math.max(1, this.w), h: 1 / Math.max(1, this.h)}; }
  public mapPoint(p: Point, invX: boolean= false, invY: boolean= false) {
    const norm =  new Point( p.x * this.w ,  p.y * this.h );
    if (invX) {norm.x = this.w - norm.x; }
    if (invY) {norm.y = this.h - norm.y; }
    return norm;
  }
  public normPoint(p: Point, invX: boolean= false, invY: boolean= false) {
    const norm =  new Point( (p.x ) / this.w,  (p.y ) / this.h);
    if (invX) {norm.x = 1 - norm.x; }
    if (invY) {norm.y = 1 - norm.y; }
    return norm;
  }
}


export class Rect {

  get size() {return new Size(this.w, this.h); }
  set size(s: Size) {this.w = s.w; this.h = s.h; }
  public static getRectForPoint(p: Point, s: Size): Rect {
    return new Rect( p.x - s.w / 2,  p.y - s.h / 2,  s.w,  s.h);
  }
  public static getSquareForPoint(p: Point, s: number): Rect {
    return Rect.getRectForPoint(p, new Size(s, s));
  }

  constructor(public x: number= 0, public y: number= 0, public w: number= 0, public h: number= 0) {}
}




