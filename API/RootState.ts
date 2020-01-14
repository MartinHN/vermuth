
import { Universe } from './Universe';
import { FixtureFactory } from './FixtureFactory';
import { Sequence, sequencePlayer } from './Sequence';
import { StateList } from './State';
import { DMXControllerI } from './DMXControllerI';
import { bindClientSocket, RemoteFunction, SetAccessible, setChildAccessible, AccessibleClass, resolveAccessible, RemoteValue , treeEvents} from './ServerSync';
import { buildEscapedJSON, buildEscapedObject } from './SerializeUtils';
import {GlobalTransport} from './Time';
import {CurvePlayer} from './CurvePlayer';
import {CurveStore} from './Curve';

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
  public readonly sequenceList = new Array<Sequence>();
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

  @RemoteValue()
  public testValue = 1;
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

  public async init() {
    await this.fixtureFactory.init();
  }

  get treeEvents() {
    return treeEvents;
  }
  public configureFromObj(ob: any) {
    const validObj = ob !== undefined;

    if (ob.universe !== undefined ) {
    }
    this.universe.configureFromObj(ob.universe || {});

    if (ob.sequenceList !== undefined) {
    }
    this.sequenceList.splice(0, this.sequenceList.length);
    (ob.sequenceList || []).map((e: any) => this.sequenceList.push(Sequence.createFromObj(e)));

    if (ob.stateList !== undefined) {
    }
    this.stateList.configureFromObj(ob.stateList || {});

    if (ob.curveStore !== undefined) {
    }
    this.curveStore.configureFromObj(ob.curveStore || {});


    if (ob.dmxController !== undefined && this.dmxController) {
    }
    if (this.dmxController) {this.dmxController.configureFromObj(ob.dmxController || {}); } else {console.error('dmxController not instanciated'); }


    bindClientSocket('auto');
    this.__isConfigured = validObj;
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

export default rootState;
