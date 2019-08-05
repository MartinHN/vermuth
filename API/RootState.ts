
import { Universe } from './Universe'
import { Sequence,SequencePlayer } from './Sequence'
import { StateList } from './State'
import  DMXController  from './DMXController'
import { RemoteFunction,SetAccessible,AccessibleClass,resolveAccessible,RemoteValue } from "./ServerSync"
import { buildEscapedJSON } from './SerializeUtils'

@AccessibleClass()
export class RootStateType {
  // config: config;
  // DMXConfig: DMXConfig;
  @SetAccessible()
  public readonly universe = new Universe();
  public readonly sequenceList = new Array<Sequence>();
  @SetAccessible()
  public  readonly sequencePlayer = new SequencePlayer();
  @SetAccessible()
  public readonly stateList  = new StateList(this.universe);
  @SetAccessible()
  public readonly dmxController  = DMXController;
  private __isConfigured = false;
  private __isRoot = true;

  @RemoteValue()
  public testValue = 1

  constructor(){

  }

  public configureFromObj(ob: any){
    let validObj = ob!==undefined

    if(ob.universe!==undefined ){
      this.universe.configureFromObj(ob.universe)
    }
    if(ob.sequenceList!==undefined){
      this.sequenceList.splice(0,this.sequenceList.length)
      ob.sequenceList.map((e:any)=>this.sequenceList.push(Sequence.createFromObj(e)))
    }
    if(ob.stateList!==undefined){
      this.stateList.configureFromObj(ob.stateList)
    }
    this.__isConfigured = validObj
  }
  public get isConfigured(){
    return this.__isConfigured
  }

  public callMethod(saddr:string,args:any[]){
    if(saddr[0]==="/"){
      let addr = saddr.split("/")
      if(addr.length && addr[0]==="")addr.shift()


        const {accessible,parent}  = resolveAccessible(this,addr)

      if(accessible ){
        if(accessible && typeof(accessible) === 'function'){

          return accessible.apply(parent, args);
        }
        else{
          return accessible;
        }
      }
      else{
        console.error("not found accessible for :",addr)
      }
    }
  }

  public toJSONString(indent?:number){
    return buildEscapedJSON(this,indent)
  }

}



const rootState = new RootStateType();
export default rootState;
