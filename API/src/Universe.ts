import { FixtureBase, FixtureGroup } from './Fixture';
import { ChannelBase, UniverseListener } from './Channel';
import { getNextUniqueName , compareValues} from './Utils';
import { SetAccessible, setChildAccessible, AccessibleClass , RemoteFunction, nonEnumerable} from './ServerSync';
import {addProp, deleteProp} from './MemoryUtils';
import {debounce} from 'lodash'

export interface UniverseI {

}

@AccessibleClass()
export class Universe implements UniverseI {

  @nonEnumerable()
  public readonly testedChannel = new ChannelBase('tested', 0, -1);
  @SetAccessible({readonly: true})
  public  testedFixture = new FixtureBase('testedFixture', [this.testedChannel]);
  public driverName = 'none';

  @SetAccessible({readonly: true})
  public  fixtures: {[id: string]: FixtureBase} = {};

  @SetAccessible({readonly: true})
  public  groups: {[id: string]: FixtureGroup} = {};




  private _master = 1.0;
  constructor() {
    this.testedChannel.setValue( 1.0, true);
    this.checkDuplicatedCircDebounced = debounce(this.checkDuplicatedCirc.bind(this),100,{trailing:true})
    // this.testedChannel.setParentFixture({baseCirc:0})
  }


  public get grandMaster() {return this._master; }
  public get groupNames() { return Object.keys(this.groups); }

  @RemoteFunction({sharedFunction: true})
  public addGroup(name: string) {
    this.groups[name] = new FixtureGroup(name,[],this);
    this.groups[name].universe = this;
    return this.groups[name] as FixtureGroup;
  }

  @RemoteFunction({sharedFunction: true})
  public removeGroupNamed(name: string) {
    if (this.groups[name] !== undefined) {
      //this.groups[name].universe = null;
      delete this.groups[name];
    }
  }


  public getGroupsForFixture(f: FixtureBase) {
    return Object.values(this.groups).filter( (v) => v.fixtureNames.includes(f.name));
  }
  public getGroupNamesForFixture(f: FixtureBase) {
    return this.getGroupsForFixture(f).map((g) => g.name);
  }
  public getFixturesInGroupNamed(gName: string) {
    return this.groups[gName] ? this.groups[gName].fixtures : [];
  }

  @RemoteFunction({sharedFunction: true})
  public setGroupNamesForFixture(f: FixtureBase, gNames: string[]) {
    const validGNames = gNames.filter((g) => this.groupNames.includes(g));
    const toAdd  = validGNames.filter((v) => !this.getGroupNamesForFixture(f).includes(v));
    const toRm = this.getGroupNamesForFixture(f).filter((v) => !validGNames.includes(v));
    for (const g of toRm) {
      this.groups[g].removeFixtureName(f.name);
    }
    for (const g of toAdd) {
      this.groups[g].addFixtureName(f.name);
    }
  }
  public get groupList() {
    // this.refreshGroupList()
    return Object.values(this.groups);
  }


  public refreshGroupList() {
    // const oldNames = this.groupNames
    // this.groupNames.map(n=>this.removeGroupNamed(n))

    // oldNames.map(k=> {
    //   this.groups[k] =new FixtureGroup(k,this.getFixturesInGroupNamed(k))
    //   this.groups[k].universe = this
    // });
  }
  public get fixtureList() {return Object.values(this.fixtures); }

  public get fixtureAndGroupList() {
    return (this.groupList as Array<FixtureBase | FixtureGroup>).concat(this.fixtureList);
  }

  public getFixtureListFromNames(n: string[]) {return n.map((e) => this.fixtures[e]).filter((e) => e !== undefined); }
  public getFixtureNamed(n: string) {return this.fixtures[n]; }
  public get sortedFixtureList() {return this.fixtureList.slice().sort(compareValues('name', 'asc')); }

  // singleton guard
  // public static createFromObj(ob: any): Universe

  public configureFromObj(ob: any) {
    if (ob.driverName) {
      this.setDriverName(ob.driverName);
    }
    this.fixtureList.map((f) => this.removeFixture(f));
    if (ob.fixtures) {
      for (const f of Object.values(ob.fixtures) ) {
        const df = FixtureBase.createFromObj(f);
        if (df) {
          this.addFixture(df);
        }
      }

    }
    this.groupNames.map((g) => this.removeGroupNamed(g));
    if (ob.groups) {
      for ( const [k, v] of Object.entries(ob.groups)) {
        const gi = this.addGroup(k);
        gi.configureFromObj(v);
      }
    }



  }
  public checkDuplicatedCircDebounced: () => void;

  private checkDuplicatedCirc() {

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
  @RemoteFunction({sharedFunction:true})
  public addFixture(f: FixtureBase) {
    if(f && !(f instanceof FixtureBase)){
      const ob = f as any
      ob.name = getNextUniqueName(this.fixtureList.map((ff) => ff.name), ob.name);
      f = new FixtureBase(ob.name,[],(f as any).ftype);
      f.configureFromObj(ob)
    }
    f.name = getNextUniqueName(this.fixtureList.map((ff) => ff.name), f.name);

    setChildAccessible(this.fixtures, f.name,  {defaultValue: f});
    f.__events.on('nameChanged', (ff: FixtureBase, oldName: string) => {
      const newName = getNextUniqueName(this.fixtureList.filter((fff) => fff !== ff).map((fff) => fff.name), ff.name);
      delete this.fixtures[oldName];
      ff.setName(newName);
      setChildAccessible(this.fixtures, newName, {defaultValue: ff});
    });
    f.universe = this;
  }
  @RemoteFunction({sharedFunction:true})
  public removeFixture(f: FixtureBase) {
    if(f && f.name){
      delete this.fixtures[f.name];
  }}
  
  public getNextCirc(d: number, forbidden?: number[]): number {
    const circsUsed = this.allChannels.map((ch) => ch.trueCirc).concat(forbidden || []);
    while (circsUsed.indexOf(d) !== -1) {d += 1; }
    return d;
  }

  public checkCircsValidity() {
    const usedChannels = new Array<number>();
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
    const res = new Array<ChannelBase>();
    for (const f of this.fixtureList) {
      f.channels.map((c) => res.push(c));
    }
    return res;
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

  public getUIDForChannel(c: ChannelBase) {
    return c.getUID(); // like :: c.parentFixture.name + "/" + c.name
  }

  public getChannelFromUID(uid: string) {
    return this.allChannels.find((c) => this.getUIDForChannel(c) === uid);
  }

  @RemoteFunction({sharedFunction: true})
  public setAllColor(color: {r: number; g: number; b: number}, setWhiteToZero: boolean) {
    this.fixtureList.map((f) => f.setColor(color, setWhiteToZero));
  }

  @RemoteFunction({sharedFunction: true})
  public setGroupColor(gName: string, color: {r: number; g: number; b: number}, setWhiteToZero: boolean) {
    this.getFixturesInGroupNamed(gName).map((f) => f.setColor(color, setWhiteToZero));
  }
  @RemoteFunction({sharedFunction: true})
  public setGroupMaster(gName: string, v: number) {
    this.getFixturesInGroupNamed(gName).map((f) => f.dimmerValue = v);
  }

  public testDimmerNum(d: number) {
    debugger;
    this.setTestedChannelDimmer(d);
  }


  @RemoteFunction({skipClientApply: true})
  public panic() {
    this.allChannels.map((c) => c.setValue(0.0, true));
    this.updateChannelsValues();
  }

  public setTestedChannelDimmer(dimmerNum: number ) {
    this.testedChannel.setCirc( dimmerNum);
  }


}

