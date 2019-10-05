import { FixtureBase } from './Fixture';
import { ChannelBase, UniverseListener } from './Channel';
import { getNextUniqueName , compareValues} from './Utils';
import { addProp, deleteProp } from './MemoryUtils';
import { SetAccessible, setChildAccessible, AccessibleClass , RemoteFunction} from './ServerSync';

@AccessibleClass()
export class Universe {

  public readonly testedChannel = new ChannelBase('tested', 0, -1, false);
  public driverName = 'none';

  @SetAccessible()
  public readonly fixtures: {[id: string]: FixtureBase} = {};

  @SetAccessible()
  public readonly groups: {[id: string]: string[]} = {};


  private _master = 1.0;
  constructor() {
  }


  public get grandMaster() {return this._master; }
  public get groupNames() { return Object.keys(this.groups); }
  public addGroup(name: string, nl: string[]) {
    addProp(this.groups, name, nl);
    setChildAccessible(this.groups, name);
  }
  public removeGroup(name: string) {deleteProp(this.groups, name); }

  public get fixtureList() {return Object.values(this.fixtures); }
  public get sortedFixtureList() {return this.fixtureList.slice().sort(compareValues('name', 'asc')); }

  // singleton guard
  // public static createFromObj(ob: any): Universe

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
      if (ob.groups) {
        Object.keys(this.groups).map((g) => this.removeGroup(g));
        for ( const g of Object.keys(ob.groups)) {
          this.addGroup(g, ob.groups[g]);
        }
      }
    } else {
      console.error('parsing error', JSON.stringify(ob));
    }


  }

  public checkDuplicatedCirc() {

    const allChs = this.allChannels;
    for ( const c of allChs) {
      c.hasDuplicatedCirc = false;
    }
    for ( let i = 0 ; i < allChs.length; i++) {

      const c = allChs[i];
      for (let j = i + 1 ; j < allChs.length; j++) {
        const cc = allChs[j];
        if (c.isSameAs(cc)) {
          console.error('bug in duplicatedCircCheck');
        }
        if (c.trueCirc === cc.trueCirc) {
          c.hasDuplicatedCirc = true;
          cc.hasDuplicatedCirc = true;
        }
      }
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
      const newName = getNextUniqueName(this.fixtureList.filter((fff) => fff !== ff).map((fff) => fff.name), ff.name);
      deleteProp(this.fixtures, oldName);
      ff.setName(newName);
      addProp(this.fixtures, newName, ff);
      setChildAccessible(this.fixtures, ff.name);
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
  public updateChannelsValues() {
    const chs = this.allChannels;
    let i = 1;
    while (i <= 512) {
      const ch = chs.find((c) => c.trueCirc === i);
      const v = ch ? ch.floatValue : 0;
      UniverseListener.notify(i, v);
      i++;
    }
  }

  @RemoteFunction({sharedFunction: true})
  public setAllColor(color: {r: number, g: number, b: number},setWhiteToZero:boolean) {
    this.fixtureList.map((f) => f.setColor(color,setWhiteToZero));
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

