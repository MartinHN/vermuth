import { ChannelBase } from './Channel';
import { FixtureBase,fixtureAll } from './Fixture';


export class FixtureState{
  public name:string;
  constructor(fixture:FixtureBase|string) {
    if(typeof fixture === 'string'){
      this.name = fixture;
    }
    else{
      this.name = fixture.name
      for (const c of fixture.channels) {
        if (c.enabled) {
          this.pChannelValues[c.name]= c.value;
        }
      }
    }

  }
  private pChannelValues: {[id:string]: number; } = {};
  get channelValues() {return Object.assign({},this.pChannelValues); }


  public setAllValues(v: number) {
    for (const k in this.pChannelValues) {
      this.pChannelValues[k] = v
    }
  }
  public static fromObj(o: any): FixtureState {
    const res = new FixtureState(o.name);
    res.pChannelValues = o.pChannelValues//.map( (oo: any) => res.pChannelValues[oo.channelName]= oo.value)) );
    return res;
  }


}

export class ResolvedFixtureState {
  public channels:{ [id:string]: {channel:ChannelBase,value: number }} = {}

  constructor(public state:FixtureState,public fixture:FixtureBase){
    for(const k in this.state.channelValues){
      const cv = this.state.channelValues[k]
      const c = this.fixture.getChannelForName(k)
      if(c){this.channels[c.name]= {channel:c,value:cv};}
    }
  }

  public applyState(){
    for(const k in this.channels){
      const cv = this.channels[k]
      cv.channel.setValue(cv.value);
    }
  }
  public applyFunction(cb:(channel:ChannelBase,value:number)=>void){
    for(const k in this.channels){
      const cv = this.channels[k]
      cb(cv.channel,cv.value);
    }
  }
}

export class MergedState{
  public channels:{channel:ChannelBase,sourcev: number, targetv:number }[] = []
  constructor(public target:ResolvedFixtureState[]){
    // const sourceNames = Object.keys(source.channels)
    // const targetNames = Object.keys(target.channels)
    // const allNames = new Set(targetNames)
    for(const rfs of target){
      const sourceFixture = rfs.fixture;
      if(sourceFixture){
        for(const i in rfs.channels){
          const channelObj = rfs.channels[i]
          const channel = channelObj.channel
          const sourcev = channel.value
          const targetv = channelObj.value
          this.channels.push({channel,sourcev,targetv})
        }
      }
    }
  }

  checkIntegrity(){
    const dupl = this.channels.filter((c,i) => {
      return i<this.channels.length-1 && this.channels.slice(i+1).find(cc=> c.channel===cc.channel)!==undefined;
    })
    if(dupl.length){
      console.error(dupl)
    }
  }
  

}


export class State {
  fixtureStates: FixtureState[] = []
  constructor(public name:string,fixtures:FixtureBase[]){
    for(const f of fixtures){
      this.fixtureStates.push(new FixtureState(f));
    }
  }

  public static fromObj(o: any): State {
    const res = new State(o.name,[]);
    o.fixtureStates.map( (oo: any) => {
      const fs = FixtureState.fromObj(oo);
      if(fs){
        res.fixtureStates.push(fs);
      }
    });
    return res;
  }
  



  public setAllValues(v: number) {
    for(const f of this.fixtureStates){
      f.setAllValues(v);
    }
    return this;
  }
  
  public resolveState(context: FixtureBase[]):ResolvedFixtureState[]{
    const res:ResolvedFixtureState[] = []
    for(const f of this.fixtureStates){
      const fix = context.find(ff => ff.name===f.name)
      if(fix){
        res.push(new ResolvedFixtureState(f,fix))
      }
    }
    return res;
  }
  public recall(context: FixtureBase[],cb:(channel:ChannelBase,value:number)=>void | undefined){
    const rs = this.resolveState(context);
    if(cb){
      rs.map(s => s.applyFunction(cb))
    }
    else{
      rs.map(s => s.applyState())
    }
  }

}


export const blackState = new State('black', [fixtureAll]).setAllValues(0.0);
export const fullState = new State('full', [fixtureAll]).setAllValues(1.0);
