
import { Universe } from './Universe';
import { Sequence, sequencePlayer } from './Sequence';
import { StateList } from './State';
import { DMXControllerI } from './DMXControllerI';
import { bindClientSocket, RemoteFunction, SetAccessible, setChildAccessible, AccessibleClass, resolveAccessible, RemoteValue } from './ServerSync';
import { buildEscapedJSON, buildEscapedObject } from './SerializeUtils';



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

  public callMethod(saddr: string, args: any[]) {// args is passed as array
    if (saddr[0] === '/') {
      const addr = saddr.split('/');

      if (addr.length && addr[0] === '') {addr.shift(); }


      const {accessible, parent, key}  = resolveAccessible(this, addr);

      if (accessible !== undefined ) {
        if (typeof(accessible) === 'function') {
          // if(args && args.length){
            return accessible.call(parent, ...args);
          // }
          // else{
          //   return accessible.apply(parent);
          // }
        } else if ( (args !== undefined && args !== null)) {
          if (parent && key) {
            if (accessible !== args) {parent[key] = args; }
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
    debugger;
    return buildEscapedJSON(this, indent);
  }
  public toJSONObj() {
    debugger;
    return buildEscapedObject(this);
  }

}



const rootState = new RootStateType();
export default rootState;
