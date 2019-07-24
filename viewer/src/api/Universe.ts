import { FixtureBase } from './Fixture';
import { getNextUniqueName } from './Utils';


export class Universe {
  public get grandMaster() {return this._master; }

  public static fromObj(ob: any): Universe {
    const uni = new Universe();
    if (ob.fixtures) {
      for (const f of ob.fixtures) {
        const df = FixtureBase.fromObj(f);
        if (df) {
          uni.addFixture(df);
        }
      }
    } else {
      console.error('parsing error');
    }
    return uni;

  }
  public fixtures = new Array<FixtureBase>();
  private _master = 1.0;
  constructor() {}
  public setGrandMaster(n: number) {
    this._master = n;
    for ( const f of this.fixtures) {
      f.setMaster(this._master);
    }
  }

  public addFixture(f: FixtureBase) {
    f.name = getNextUniqueName(this.fixtures.map((ff) => ff.name), f.name);

    this.fixtures.push(f);
    f.universe = this;
  }
  public removeFixture(f: FixtureBase) {
    const i = this.fixtures.findIndex((ff) => ff === f);
    if (i >= 0) {this.fixtures.splice(i, 1); }
  }
  public getNextCirc(d: number, forbidden?: number[]): number {
    const circsUsed = this.fixtures.map((ff) => ff.channels).flat().map((ch) => ch.trueCirc).concat(forbidden || []);
    while (circsUsed.indexOf(d) !== -1) {d += 1; }
    return d;
  }

  public checkCircsValidity() {
    const usedChannels = [];
    for ( const f of this.fixtures) {
      for (const c of f.channels) {
        c.hasDuplicatedCirc = usedChannels.indexOf(c.trueCirc) !== -1;
        if (!c.hasDuplicatedCirc) {
          usedChannels.push(c.trueCirc);
        }
      }
    }
  }


}

