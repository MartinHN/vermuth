
import { Universe } from './Universe';
import { FixtureFactory } from './FixtureFactory';
import { Sequence, sequencePlayer, SequencePlayerClass, SequenceList } from './Sequence';
import { StateList } from './State';
import { DMXControllerI } from './DMXControllerI';
import { bindClientSocket, RemoteFunction, SetAccessible, setChildAccessible, AccessibleClass, rebuildChildAccessibles,resolveAccessible, RemoteValue , treeEvents} from './ServerSync';
import { buildEscapedJSON, buildEscapedObject } from './SerializeUtils';
import {GlobalTransport} from './Time';
import {CurvePlayer} from './CurvePlayer';
import {CurveStore} from './Curve';
import { addProp } from './MemoryUtils';
import dbg from './dbg'
const debugStruct = dbg('STRUCT')
const debugTime = dbg('TIME')


@AccessibleClass()
export class RootStateType {
  public get isConfigured() {
    return this.__isConfigured;
  }
  // config: config;
  // DMXConfig: DMXConfig;
  @SetAccessible({readonly: true})
  public readonly universe = new Universe();
  @SetAccessible({readonly: true})
  public readonly sequenceList = new SequenceList();
  @SetAccessible({readonly: true})
  public readonly sequencePlayer = sequencePlayer;
  @SetAccessible({readonly: true})
  public readonly globalTransport = GlobalTransport;
  @SetAccessible({readonly: true})
  public readonly curveStore = CurveStore;


  @SetAccessible({readonly: true})
  public readonly curvePlayer = CurvePlayer;

  @SetAccessible({readonly: true})
  public readonly fixtureFactory = FixtureFactory;

  @SetAccessible({readonly: true})
  public readonly stateList  = new StateList(this.universe);

  public  dmxController?: DMXControllerI;


  public meta = {loadingJSONName:""};
  private __isConfigured = false;
  private __isRoot = true;

  constructor() {
    sequencePlayer.linkToRoot(this);

  }
  public registerDMXController(d: DMXControllerI) {
    if (this.dmxController) {
      debugger;
      console.error('double registration of dmx controller');
    }

    // debugger

    setChildAccessible(this, 'dmxController', {defaultValue: d});
    bindClientSocket('auto');
  }

  public async init(ob?:any) {
    await this.fixtureFactory.init(ob?.ressourceDir);
  }

  get treeEvents() {
    return treeEvents;
  }

  public logTree(){
    console.log("rootTree",rebuildChildAccessibles(this,true,false))
  }
  public configureFromObj(ob: any) {
    const validObj = ob !== undefined;
    const startLoadTime = new Date().getTime()
    if (ob.universe !== undefined ) {
    }
    this.meta.loadingJSONName = "universe"
    this.universe.configureFromObj(ob.universe || {});

    if (ob.sequenceList !== undefined) {
    }
    this.meta.loadingJSONName = "sequences"
    this.sequenceList.configureFromObj(ob.sequenceList || {});



    if (ob.curveStore !== undefined) {
    }
    this.meta.loadingJSONName = "curveStore"
    this.curveStore.configureFromObj(ob.curveStore || {});

    if (ob.curvePlayer !== undefined) {
    }
    this.meta.loadingJSONName = "curvePlayer"
    this.curvePlayer.configureFromObj(ob.curvePlayer || {});

    if (ob.stateList !== undefined) {
    }
    this.meta.loadingJSONName = "stateList"
    this.stateList.configureFromObj(ob.stateList || {});

    if (ob.dmxController !== undefined && this.dmxController) {
    }
    this.meta.loadingJSONName = "dmxController"
    if (this.dmxController) {this.dmxController.configureFromObj(ob.dmxController || {}); } else {console.error('dmxController not instanciated'); }


    bindClientSocket('auto');
    this.__isConfigured = validObj;

    const timeToLoad = (new Date().getTime() - startLoadTime);
    debugTime('loaded RootState in ',timeToLoad/1000,'s')
    this.meta.loadingJSONName = ""

    // setTimeout(testActions,5000)
  }
  public clear() {
    this.universe.configureFromObj({});
  }


  public toJSONString(indent?: number) {
    // debugger;
    return buildEscapedJSON(this, indent);
  }
  public toJSONObj() {
    // debugger;
    return buildEscapedObject(this);
  }

}


const rootState = new RootStateType();

// import {ActionFactory} from "./Actions"
// function testActions(){

//   const fkAction = ActionFactory.generateActionFromObj({ atype: "setDimmer" ,input:0.5})
//   debugger
//   if(fkAction){
//   const validT = fkAction?.filterTarget(rootState.universe.fixtureList);
//   console.log("valid +++++ ",validT)
//   fkAction.targets = validT || [];
//   fkAction.apply();
//   }
// }



export default rootState;
