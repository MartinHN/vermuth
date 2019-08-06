import { FixtureBase } from './Fixture';
import { ChannelBase } from './Channel';
import { getNextUniqueName } from './Utils';
import { addProp, deleteProp } from './MemoryUtils';
import { SetAccessible, setChildAccessible, AccessibleClass } from './ServerSync';

@AccessibleClass()
export class Universe {

  public readonly testedChannel = new ChannelBase('tested', 0, -1, false);
  public driverName = 'none';
  @SetAccessible()
  public readonly fixtures: {[id: string]: FixtureBase} = {};
  private _master = 1.0;
  constructor() {
  }

  public get grandMaster() {return this._master; }
  public get fixtureList() {return Object.values(this.fixtures); }
// singleton guard
  // public static createFromObj(ob: any): Universe {
  //   const uni = new Universe();
  //   uni.configureFromObj(ob)
  //   return uni;

  // }
  public configureFromObj(ob: any) {
    if (ob.driverName) {
      this.setDriverName(ob.driverName);
    }
    if (ob.fixtures) {
      this.fixtureList.map((f) => this.removeFixture(f));
      for (const f of Object.values(ob.fixtures) ) {
        const df = FixtureBase.createFromObj(f);
        if (df) {
          this.addFixture(df);
        }
      }
    } else {
      console.error('parsing error', JSON.stringify(ob));
    }


  }

  public setDriverName(n: string) {
    this.driverName  = n;
  }
  public setGrandMaster(n: number) {
    this._master = n;
    for ( const f of this.fixtureList) {
      f.setMaster(this._master);
    }
  }

  public addFixture(f: FixtureBase) {

    f.name = getNextUniqueName(this.fixtureList.map((ff) => ff.name), f.name);

    addProp(this.fixtures, f.name, f);
    setChildAccessible(this.fixtures, f.name);
    f.__events.on('nameChanged', (ff: FixtureBase, oldName: string) => {
      const newName = getNextUniqueName(this.fixtureList.filter((f) => f !== ff).map((f) => f.name), ff.name);
      deleteProp(this.fixtures, oldName);
      ff.setName(newName);
      addProp(this.fixtures, newName, ff);
      setChildAccessible(this, ff.name);
    });
    f.universe = this;
  }
  public removeFixture(f: FixtureBase) {
    deleteProp(this.fixtures, f.name);
  }
  public getNextCirc(d: number, forbidden?: number[]): number {
    const circsUsed = this.fixtureList.map((ff) => ff.channels).flat().map((ch) => ch.trueCirc).concat(forbidden || []);
    while (circsUsed.indexOf(d) !== -1) {d += 1; }
    return d;
  }

  public checkCircsValidity() {
    const usedChannels = [];
    for ( const f of this.fixtureList) {
      for (const c of f.channels) {
        c.hasDuplicatedCirc = usedChannels.indexOf(c.trueCirc) !== -1;
        if (!c.hasDuplicatedCirc) {
          usedChannels.push(c.trueCirc);
        }
      }
    }
  }
  public get allChannels() {
    // console.log('fliiiiist',this.fixtureList.map(f=>f.channels))
    return this.fixtureList.map((f) => f.channels).flat();
  }


  public testDimmerNum(d: number) {
    if (this.testedChannel.circ >= 0) {
      this.testedChannel.setValue( 0.0, true);
    }

    this.setTestedChannelDimmer(d);
    if (this.testedChannel.circ >= 0) {
      this.testedChannel.setValue( 1.0, true);
    }
  }

  public setTestedChannelDimmer(dimmerNum: number ) {
    this.testedChannel.circ = dimmerNum;
  }


}

