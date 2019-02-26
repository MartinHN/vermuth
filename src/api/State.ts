import { ChannelBase } from './Channel'



export class ChannelWithValue {
  public channelName!:string;
  public value!:number;
  // constructor(c:ChannelBase){
    //   this.channelName=c.name;
    //   this.value=c.value;
    // }
    constructor(n:string | ChannelBase,v:number=0){
      if(typeof(n)==="string"){
        this.channelName=n;
        this.value=v;
      }
      else{
        this.channelName=n.name;
        this.value=n.value;
      }

    }

  }



  export class State {
    private _channelValues: ChannelWithValue[] =[];
    constructor(public name: string, cl:ChannelBase[] ) {
      for(const c of cl){
        if(c.enabled){
        this._channelValues.push(new ChannelWithValue(c))
      }
      }
    }

    get channelValues(){return this._channelValues.slice();}

    static fromObj(o:any):State{
      let res = new State(o.name,[])
      o._channelValues.map( (oo:any) => res._channelValues.push(new ChannelWithValue(oo.channelName,oo.value)) )
      return res;
    }
  }