import { ChannelBase } from './Channel';



export class ChannelWithValue {
  public channelName!: string;
  public value!: number;

  constructor(n: string | ChannelBase, v: number= 0) {
    if (typeof(n) === 'string') {
      this.channelName = n;
      this.value = v;
    } else {
      this.channelName = n.name;
      this.value = n.value;
    }

  }

}



export class State {

  get channelValues() {return this.pChannelValues.slice(); }

  public static fromObj(o: any): State {
    const res = new State(o.name, []);
    o.pChannelValues.map( (oo: any) => res.pChannelValues.push(new ChannelWithValue(oo.channelName, oo.value)) );
    return res;
  }
  private pChannelValues: ChannelWithValue[] = [];
  constructor(public name: string, cl: ChannelBase[] ) {
    for (const c of cl) {
      if (c.enabled) {
        this.pChannelValues.push(new ChannelWithValue(c));
      }
    }
  }
}

//   const channelAll = new ChannelBase('all',0,true)
// const blackState = new State('black',[new ChannelWithValue('black',Array(513).fill().map((_, idx) => start + idx))])

// export blackState;
