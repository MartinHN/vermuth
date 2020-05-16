import { EventEmitter } from 'events';
import { ChannelBase, ChannelGroup } from './Channel';
import { Universe } from './Universe';
import { getNextUniqueName, arraysEqual } from './Utils';
import { buildEscapedObject } from './SerializeUtils';

import { RemoteFunction, RemoteValue, SetAccessible, AccessibleClass, setChildAccessible, nonEnumerable } from './ServerSync';

type ChannelValueType = ChannelBase['__value'];
export interface FixtureBaseI {
  name: string;
  baseCirc: number;

}
type FixtureConstructorI = (...args: any[]) => FixtureBase;
const fixtureTypes: { [key: string]: FixtureConstructorI } = {};

@AccessibleClass()
export class FixtureBase implements FixtureBaseI {





  public set baseCirc(n: number) {
    if (isNaN(n)) { debugger; return; }
    if (n === 0) { n = 1; debugger; }
    this.__setBaseCirc(n);
  }
  public get baseCirc(): number { return this._baseCirc; }




  public get universe() {
    return this.__universe;
  }

  public set universe(uni: Universe | null) {
    this.__universe = uni;
    this.channels.map((c) => c.setParentFixture(this));
  }
  get groupNames(): string[] {
    return this.universe ? this.universe.getGroupsForFixture(this).map(e => e.name) : [];
  }
  get channelNames(): string[] {
    return this.channels.map((c) => c.name);
  }
  get channelsState() {
    return this.channels.map((c) => c.getState());
  }
  public get colorChannels(): { [id: string]: ChannelBase } {
    return this.getUniqueChannelsOfRole('color');
  }
  public get positionChannels(): { [id: string]: ChannelBase } {
    return this.getUniqueChannelsOfRole('position');
  }

  public get dimmerChannels() {
    return this.getChannelsOfRole('dim').dimmer;
  }

  public get hasColorChannels(): boolean {
    return this.colorChannels && Object.values(this.colorChannels).length > 0;
  }
  public get hasPositionChannels(): boolean {
    return this.positionChannels && Object.values(this.positionChannels).length > 0;
  }

  public get hasDimmerChannels(): boolean {
    return this.dimmerChannels && Object.values(this.dimmerChannels).length > 0;
  }






  get span(): number {
    let span = 0;
    for (const c of this.channels) {
      span = Math.max(c.circ + 1, span);
    }
    return span;
  }
  get fixtureType(): string {
    return this.ftype;
  }

  get endCirc(): number {
    return this.span + this._baseCirc - 1;
  }


  public get dimmerValue(): number {
    return this.pdimmerValue;
  }


  public set dimmerValue(v: ChannelValueType) {
    if (isNaN(v)) { debugger; return; }
    this.pdimmerValue = v;
    if (this.channels) {
      for (const c of this.channels) {
        if (c.reactToMaster) {
          c.setValue(v, true);
        }
      }
    } else {
      debugger;
    }
  }


  public get dimmerInSync(): boolean {
    for (const c of this.channels.filter((cc) => cc.reactToMaster)) {
      if (c.floatValue !== this.dimmerValue) { return false; }
    }
    return true;
  }

  public static createFromObj(ob: any): FixtureBase | undefined {
    if (ob.pchannels !== undefined) {
      const cstr = fixtureTypes[ob.ftype];
      if (cstr) {
        const i = cstr(ob.name, []);
        i.configureFromObj(ob);

        return i;
      } else {
        const res = new FixtureBase('temp', []);
        res.configureFromObj(ob);
        return res;
      }
    }
  }



  @nonEnumerable()
  public __events = new EventEmitter();

  @SetAccessible({ readonly: true })
  protected readonly pchannels = new Array<ChannelBase>();

  get channels() {
    return this.pchannels
  }
  set channels(c: Array<ChannelBase>) {
    console.error('readonly')
    debugger;

  }
  private pdimmerValue = 0;

  // protected ftype = 'base';

  @RemoteValue()
  private _baseCirc = 0;
  @RemoteValue()
  public name: string

  @nonEnumerable()
  private __universe: Universe | null = null;

  constructor(_name: string, channels: ChannelBase[], protected ftype = 'base') {
    this.name = _name;
    if (channels && channels.length) {
      channels.map((c) => this.addChannel(c));
    } else {
      // debugger;
    }

  }




  @RemoteFunction({sharedFunction:true})
  public clone(circInc: number) {
    const ob = buildEscapedObject(this)
    if (this.__universe) {
      ob.name = getNextUniqueName(this.__universe.fixtureList.map(f => f.name), ob.name)
      ob._baseCirc+=circInc;
    }
    else{
      console.error('bug in clone')
    }
    const res = FixtureBase.createFromObj(ob) as FixtureBase;
    res.ftype = this.ftype;
    if(this.__universe){
      this.__universe.addFixture(res)
    }
    return res;
  }

  public configureFromObj(ob: any) {

    if (ob._baseCirc !== undefined) { this.baseCirc = ob._baseCirc; }
    this.channels.map((c: ChannelBase) => this.removeChannel(c));
    if (ob.pchannels !== undefined) {
      ob.pchannels.map((c: any) => this.addChannel(ChannelBase.createFromObj(c, this)));
    }
    if (ob.name !== undefined) { this.setName(ob.name); }
  }


  public setName(n: string) {
    const oldName = this.name;
    this.name = n;
    if (oldName !== n) {
      this.__events.emit('nameChanged', this, oldName);
    }

  }

  public hasChannelMatchingFilters(fl: string[]) {
    if (fl.length === 0) {
      return true;
    } else if (fl.some((e) => 'all' === e)) {
      return true;
    }
    return Object.values(this.channels).some((e) => fl.some((f) => e.matchFilter(f)));
  }
  public buildAddress() {
    return '/mainUniverse/' + this.name;
  }

  public getChannelsOfRole(n: string): { [id: string]: ChannelBase[] } {
    // @ts-ignore
    // if(this.isGroup){debugger}
    const cch: { [id: string]: ChannelBase[] } = {};
    for (const ch of this.channels) {
      if (ch.roleFam === n) {
        if (Object.keys(cch).includes(ch.roleType)) {
          cch[ch.roleType].push(ch);

        } else {
          cch[ch.roleType] = [ch];
        }
      }
    }
    return cch;
  }
  
  public getUniqueChannelsOfRole(n: string): { [id: string]: ChannelBase } {
    // @ts-ignore
    // if(this.isGroup){debugger}
    const cch: { [id: string]: ChannelBase } = {};
    for (const ch of this.channels) {
      if (ch.roleFam === n) {
        if (Object.keys(cch).includes(ch.roleType)) {

          console.error('not unique, ignoring', ch.roleType);
          // cch[ch.roleType].push(ch);

        } else {
          cch[ch.roleType] = ch;
        }
      }
    }
    return cch;
  }

  public hasChannelsOfRole(n: string) {
    const ch = this.getChannelsOfRole(n);
    return ch && Object.keys(ch).length > 0;
  }

  public hasActiveChannels() {
    return (this.dimmerChannels || this.channels).some((c) => c.floatValue > 0);
  }

  @RemoteFunction({ sharedFunction: true })
  public setMaster(v: ChannelValueType) {
    this.dimmerValue = v;
  }

  @RemoteFunction({ sharedFunction: true ,allowRawObj:true})
  public setColor(c: { r: number; g: number; b: number;w?: number }, setWhiteToZero: boolean) {
    const cch = this.colorChannels;
    if (cch !== {}) {
      if (c) {
        if (cch.r) { this.setCoarseAndFine(c.r, cch.r, cch.r_fine); }
        if (cch.g) { this.setCoarseAndFine(c.g, cch.g, cch.g_fine); }
        if (cch.b) { this.setCoarseAndFine(c.b, cch.b, cch.b_fine); }
        if (cch.w && (c.w!==undefined || setWhiteToZero) )  { this.setCoarseAndFine(c.w || 0, cch.w, cch.w_fine); }
      }
      else {
        console.error('color not valid')
        debugger
      }
    }
  }

  @RemoteFunction({ sharedFunction: true })
  public getColor(includeWhite = true) {
    const res: { r: number; g: number; b: number; w?: number } = { r: 0, g: 0, b: 0 };
    const cch = this.colorChannels;
    if (cch !== {}) {
      if (cch.r) { res.r = this.getCoarseAndFine(cch.r, cch.r_fine); }
      if (cch.g) { res.g = this.getCoarseAndFine(cch.g, cch.g_fine); }
      if (cch.b) { res.b = this.getCoarseAndFine(cch.b, cch.b_fine); }
      if (includeWhite && cch.w) { res.w = this.getCoarseAndFine(cch.w, cch.w_fine); }
    }
    return res;
  }


  @RemoteFunction({ sharedFunction: true })
  public setPosition(c: { x: number; y: number }) {
    const pch = this.positionChannels;
    if (pch !== {}) {
      if (pch.pan) { this.setCoarseAndFine(c.x, pch.pan, pch.pan_fine); }
      if (pch.tilt) { this.setCoarseAndFine(c.y, pch.tilt, pch.tilt_fine); }

    }

  }
  public getPosition() {
    const res = { x: 0, y: 0 };
    const pch = this.positionChannels;
    if (pch !== {}) {
      if (pch.pan) { res.x = this.getCoarseAndFine(pch.pan, pch.pan_fine); }
      if (pch.tilt) { res.y = this.getCoarseAndFine(pch.tilt, pch.tilt_fine); }
    }
    return res;
  }



  @RemoteFunction({ sharedFunction: true })
  public addChannel(c: ChannelBase | undefined) {
    // @ts-ignore
    // if(this.isGroup){debugger}
    if (c === undefined || c === null) {
      c = new ChannelBase('channel', 0, this.span);
    }
    else if (!(c instanceof ChannelBase)) {
      debugger
    }
    c.setParentFixture(this);
    this.channels.push(c);
    // setChildAccessible(this.channels, '' + (this.channels.length - 1));
    return c;
  }


  public removeChannel(c: ChannelBase) {
    c.__dispose();
    c.setParentFixture(null);
    const i = this.channels.indexOf(c);
    if (i >= 0) { this.channels.splice(i, 1); }// = this.channels.filter((v) => c !== v); // delete?
  }
  public removeChannelNamed(n: string) {
    const c = this.getChannelForName(n);
    if (c) {
      this.removeChannel(c);
    } else {
      console.error('unknown  channel  to remove with name ', n);
    }
  }


  public getChannelForName(n: string) {
    return this.channels.find((c) => c.name === n);
  }

  public getType() {
    return this.ftype;
  }

  @RemoteFunction({ sharedFunction: true })
  private __setBaseCirc(n: number) {
    const changedDiff = n - this._baseCirc;
    this._baseCirc = n;

    if (this.universe && changedDiff !== 0) {

      this.universe.checkDuplicatedCircDebounced();
      this.universe.updateChannelsValues();
    }
  }

  private setCoarseAndFine(v: number, c: ChannelBase | undefined, cf: ChannelBase | undefined, doNotify = true) {
    if (!c) { return; }

    if (cf !== undefined) {
      const q = 255;
      const qV = v * q;
      const flooredV = Math.floor(qV);
      c.setValue(flooredV / q, doNotify);
      const fine = (qV - flooredV);
      cf.setValue(fine, doNotify);
    } else {
      c.setValue(v, doNotify);
    }

  }
  private getCoarseAndFine(c: ChannelBase | undefined, cf: ChannelBase | undefined) {
    if (!c) { return 0; }

    if (cf !== undefined) {
      const q = 255;
      return (c.intValue + cf.intValue / q) / q;
    } else {
      return c.floatValue;
    }

  }




}


export class FixtureGroup extends FixtureBase {
  public static isFixtureGroup(f: FixtureBase): f is FixtureGroup {
    return !!((f as FixtureGroup).isGroup);
  }
  public isGroup = true;

  @nonEnumerable()
  private _cachedChannelNames: string[] = []

  // get _cachedChannelNames(){
  //   return this._cachedChannelGroups.map(e=>e.name)
  // }
  private get channelsMap(): { [id: string]: FixtureBase[] } {
    const res: { [id: string]: FixtureBase[] } = {}
    this.fixtures.map(f => {
      f.channels.map(c => {
        if (res[c.name] === undefined) { res[c.name] = []; }
        res[c.name].push(f)

      })
    })

    return res
  }
  private __updatingChannels = false
  get channelNames() {
    return Object.keys(this.channelsMap)
  }

  // @SetAccessible({readonly: true, blockRecursion: true})
  // public fixtures = new Array<FixtureBase>();

  constructor(public name: string, public fixtureNames: string[], _universe: Universe) {
    super(name, [], 'group');

    // super.channels.map(c=>super.removeChannel(c))
    // const oldCh = super.channels;
    this.universe = _universe
    if (this.channels && this.channels.length) {
      console.log(name, this.channels)
      debugger
    }
    // const newCh = super.channels;


  }
  get fixtures() {
    if (!this.universe) {
      debugger
      return [] as FixtureBase[]
    }
    return (this.universe as Universe).getFixtureListFromNames(this.fixtureNames).filter(e => e !== undefined) as FixtureBase[]
  }
  addFixtureName(n: string) {
    if (this.fixtureNames.includes(n)) {
      console.error('already existing name in group')
      return
    }
    this.fixtureNames.push(n);
  }
  removeFixtureName(n: string) {
    const idx = this.fixtureNames.indexOf(n);
    if (idx < 0) {
      console.error('non existing name in group')
      return
    }
    this.fixtureNames.splice(idx, 1)

  }


  public configureFromObj(ob: any) {
    this.fixtureNames.map((f) => this.removeFixtureName(f));
    if (ob.name && this.name !== ob.name) { console.error('name mismatch in group'); debugger; }
    if (this.universe !== undefined && this.universe !== null) {
      ob.fixtureNames.map((e: string) => this.addFixtureName(e))
    } else {
      debugger;
      console.error('universe not set in fixture group');
      return;
    }
  }

  public toJSON() {
    return { fixtureNames: this.fixtureNames, name: this.name };
  }

  // get fixtureNames() {return   this.fixtures.map((f) => f.name); }

  public isConsistent() {
    if (this.fixtures.length) {
      const t = this.fixtures[0].getType();
      return !this.fixtures.some((f) => f.getType() !== t);
    }
    return true;
  }

  get dimmerInSync() {
    if (this.fixtures.length) {
      const v = this.fixtures[0].dimmerValue;
      return this.fixtures.every((f) => f.dimmerInSync && (f.dimmerValue === v));
    }
    return true;

  }

  get channels() {
    if (!arraysEqual(this._cachedChannelNames, this.channelNames)) {
      if (!this.__updatingChannels) {
        this.__updatingChannels = true
        const newChNames = this.channelNames
        const toAdd = newChNames.filter((v) => !this._cachedChannelNames.includes(v));
        const toRm = this._cachedChannelNames.filter((v) => !newChNames.includes(v));
        toRm.map(cn => this.removeChannelNamed(cn))
        toAdd.map((n) => this.addChannel(new ChannelGroup(n, this)));
        this._cachedChannelNames = newChNames
        this.__updatingChannels = false
      }
      // else{
      //   console.error('weird recursion error')
      //   debugger
      //   // this._cachedChannelGroups.map((cg,i)=>setChildAccessible(this.channels,''+i))
      // }
    }
    const tCh = this.pchannels;
    return tCh as ChannelGroup[]

  }
  set channels(c: ChannelGroup[]) {
    if (!c || c.length === 0) { return; }
    debugger;
    // return Object.entries(this.channelsMap).map(([k,v])=>f.getChannelNamed(k))
  }

  @RemoteFunction({ sharedFunction: true })
  public addChannel(c: ChannelBase | undefined) {
    if (!c || !ChannelGroup.isChannelGroup(c)) {
      console.error("can't manually add channel on group");
      debugger
      return new ChannelBase('channel', 0, this.span);
    }
    else {
      return super.addChannel(c)
    }
  }

  // get fixtures(){
  //   return this.fixtureNames.map(n=>this.universe.getFixtureForName(n))
  // }

  // getChannelForName(n:string):ChannelBase|undefined{
  //   const cl = this.fixtures.map(f=>f.getChannelForName(n))
  //   if(cl && cl.length){
  //     return new ChannelGroup(n,this)
  //   }
  // }



}

export class DirectFixture extends FixtureBase {

  constructor(fixtureName: string, circs: number[]) {
    super(fixtureName, circs.map((c) => new ChannelBase('channel', 0, c)));
    this.ftype = 'direct';

  }


}
fixtureTypes.direct = (...args: any[]) => new DirectFixture(args[0], args[1]);


          // console.log('started')
          // const f = new DirectFixture('lala',[0])
          // console.log("setName")
          // f.setName("lala")
          // const  allCircs  = new Array(512).fill(0).map((_, idx) => idx);
          // export const fixtureAll = new DirectFixture('all', allCircs);



