
import { Universe } from './Universe';
import { Sequence, SequencePlayer } from './Sequence';
import { StateList } from './State';
import  DMXControllerI  from './DMXControllerI';
import { bindClientSocket, RemoteFunction, SetAccessible, setChildAccessible, AccessibleClass, resolveAccessible, RemoteValue } from './ServerSync';
import { buildEscapedJSON,buildEscapedObject } from './SerializeUtils';

import {addProp} from '@API/MemoryUtils';

@AccessibleClass()
export class RootStateType {
  public get isConfigured() {
    return this.__isConfigured;
  }
  // config: config;
  // DMXConfig: DMXConfig;
  @SetAccessible()
  public readonly universe = new Universe();
  public readonly sequenceList = new Array<Sequence>();
  @SetAccessible()
  public  readonly sequencePlayer = new SequencePlayer();
  @SetAccessible()
  public readonly stateList  = new StateList(this.universe);

  public  dmxController?: DMXControllerI;

  @RemoteValue()
  public testValue = 1;
  private __isConfigured = false;
  private __isRoot = true;

  constructor() {

  }
  public registerDMXController(d: DMXControllerI) {
    if (this.dmxController) {
      debugger;
      console.error('double registration of dmx controller');
    }
    addProp(this, 'dmxController' , d);
    // debugger

    setChildAccessible(this, 'dmxController');
    bindClientSocket('auto');
  }
  public configureFromObj(ob: any) {
    const validObj = ob !== undefined;

    if (ob.universe !== undefined ) {
      this.universe.configureFromObj(ob.universe);
    }
    if (ob.sequenceList !== undefined) {
      this.sequenceList.splice(0, this.sequenceList.length);
      ob.sequenceList.map((e: any) => this.sequenceList.push(Sequence.createFromObj(e)));
    }
    if (ob.stateList !== undefined) {
      this.stateList.configureFromObj(ob.stateList);
    }
    if (ob.dmxController !== undefined && this.dmxController) {
      this.dmxController.configureFromObj(ob.dmxController);
    }
    bindClientSocket('auto');
    this.__isConfigured = validObj;
  }

  public callMethod(saddr: string, args: any[]) {
    if (saddr[0] === '/') {
      const addr = saddr.split('/');

      if (addr.length && addr[0] === '') {addr.shift(); }


      const {accessible, parent, key}  = resolveAccessible(this, addr);

      if (accessible !== undefined ) {
        if (typeof(accessible) === 'function') {

          return accessible.apply(parent, ...args);
        } else if ( (args !== undefined && args !== null)) {
          if (parent && key) {
            if (accessible != args) {parent[key] = args; }
          } else {
            console.error('malformed Accessible resolution');
          }
        } else {
          return accessible;

        }
      } else {
        console.error('not found accessible for :', saddr);
      }
    }
  }

  public toJSONString(indent?: number) {
    return buildEscapedJSON(this, indent);
  }
  public toJSONObj() {
    return buildEscapedObject(this);
  }

}



const rootState = new RootStateType();
export default rootState;
