const EventEmitter = require('events');

function uuidv4() {
  return 'xxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


interface NodeClassI {
   name: string;
   parentContainer: NodeClassI;
   stringId(): string;
}


class GenericNodePoint<ContainerClass extends NodeClassI> {

  get name() {
    return this._name;
  }

  set name(n: string) {
    this._name = n;
    this.events.emit('nameChanged', this);
  }
  public uid = uuidv4();

  public parentContainer: ContainerClass | undefined;
  protected events = new EventEmitter();

  constructor(private _name: string) {
  }

  public computePath() {

    const path = [this.name];
    let i: NodeClassI = this.parentContainer;
    while (i) {
      path.push(i.name);
      i = i.parentContainer;
    }
    path.reverse();
    return path;
  }

  public computeAddress() {
    return '/' + this.computePath().join('/');
  }


  public stringId() { return '' + this.name + '(' + this.uid + ')'; }

  public setParentContainer(p: ContainerClass  | undefined) {
    console.log('setting Node Parent', p.stringId(), 'to', this.stringId());
    this.parentContainer = p;
    this.setParentInternal();
  }

  protected setParentInternal() {}

}



class GenericParameter<ContainerClass > extends GenericNodePoint<ParameterContainer> {
  private _value;
  constructor(name: string) {
    super(name);
  }

  public get() {
    return this._value;
  }

  public set(v, notifier= undefined) {
    console.log('setting p value', this.stringId());
    this._value = v;
    if (this.parentContainer) {
      this.parentContainer.notifyChildChanged(this);
    }
    this.events.emit('valueChanged', this, notifier);
  }

  protected setParentInternal() {
    console.log('set parameter parent', this.parentContainer.stringId(), 'to', this.stringId());
  }

}
type ParameterType = GenericParameter<ParameterContainer>;



interface ParameterContainerHierarchyListenerI<ParameterContainer extends GenericNodePoint<ParameterContainer>, ParameterType > {
   parameterAdded( pc: ParameterContainer, p: Parameter): void;
   parameterRemoved( pc: ParameterContainer, p: Parameter): void;
   parameterContainerAdded( pc: ParameterContainer, p: Parameter): void;
   parameterContainerRemoved( pc: ParameterContainer, p: Parameter): void;
}

interface ParameterFeedbackListenerI<ParameterContainer extends GenericNodePoint<ParameterContainer>, Parameter extends GenericParameter<ParameterContainer> > {
   parameterChanged( pc: ParameterContainer, p: Parameter): void;
}


type ParameterFeedbackListener = ParameterFeedbackListenerI<ParameterContainer, ParameterType>;
type ParameterContainerHierarchyListener = ParameterContainerHierarchyListenerI<ParameterContainer, ParameterType>;

class ParameterContainer extends GenericNodePoint<ParameterContainer> {

  public parameterContainers: {[id: string]: ParameterContainer} = {};
  public parameters: {[id: string]: ParameterType} = {};

  public feedbackListeners  = new Array<ParameterFeedbackListener>();
  public hierarchyListeners = new Array<ParameterContainerHierarchyListener>();

  constructor(name: string) {
    super(name);
  }

  public addParameter(p: ParameterType) {
    this.parameters[p.name] = p;
    p.setParentContainer(this);
    return p;
  }

  public removeParameter(p: ParameterType) {
    p.setParentContainer(undefined);
    delete this.parameters[p.name];
    this.events.emit('parameterRemoved', this);
    return p;
  }

  public addParameterContainer(p: ParameterContainer) {
    this.parameterContainers[p.name] = p;
    p.setParentContainer(this);
    this.events.emit('parameterContainerAdded', this);

    return p;
  }

  public removeParameterContainer(p: ParameterContainer) {
    p.setParentContainer(undefined);
    this.parameterContainers[p.name] = p;
    this.events.emit('parameterContainerRemoved', this);
    return p;
  }

  public notifyChildChanged(p: ParameterType) {
    let notified: ParameterContainer = this;
    while (notified) {
      for (const f of notified.feedbackListeners) {
        f.parameterChanged(this, p);
      }
      notified = notified.parentContainer;
    }
  }

}

class Parameter extends GenericParameter<ParameterContainer> {

}


// type ParameterContainerHierarchyListener = ParameterContainerHierarchyListenerI<ParameterContainer,Parameter>

//
// {
//    parameterAdded( pc: ParameterContainer, p: Parameter) {};
//    parameterRemoved( pc: ParameterContainer, p: Parameter) {};
//    parameterContainerAdded( pc: ParameterContainer, p: Parameter) {};
//    parameterContainerRemoved( pc: ParameterContainer, p: Parameter) {};
// }

///////////////////////
// DECORATORS
///////////////////////

function BindParameter(...args) {
  return function(target: any, key: string) {

    if (!target.staticParams) {
        target.staticParams = {};
    }
    target.staticParams[key] = args;
  };
}


function BindParameterContainer(...args) {
  return function(target: any, key: string) {
    if (!target.staticParamConts) {
        target.staticParamConts = {};
    }
    target.staticParamConts[key] = args;
  };
}


function BindContainer<T extends new(...args: any[]) => ParameterContainer>() {

  return function <T extends new(...args: any[]) => ParameterContainer>(constructor: T) {
    console.log('eval const');
    return class extends constructor {
      constructor(...args) {
        super(...args);
        console.log('try to bound static');
        const checkName = (pn: string) => {
          if (! ('' + this[pn].name in [pn, '']) ) {
                this[pn].name = pn;
                console.error('renaming Node to its key name');
              }
        };
        if (this.staticParams) {
          for (const pn of Object.keys(this.staticParams)) {
            if (!this[pn]) {
              console.log('creating param ', pn);
              this[pn] = new Parameter(pn);
            } else {checkName(pn); }
            this.addParameter(this[pn]);
          }
        }

        if (this.staticParamConts) {
          for (const pn of Object.keys(this.staticParamConts)) {
            if (!this[pn]) {
              console.log('creating param ', pn);
              this[pn] = new ParameterContainer(pn);
            } else {checkName(pn); }
            this.addParameterContainer(this[pn]);
          }
        }

      }
    };
  };


}


//////////////////////////
// TEST
/////////////////////////


@BindContainer()
class RootCont extends ParameterContainer {

  @BindParameter()
  public num ;

  @BindParameterContainer()
  public subCont = new ParameterContainer('lkj');
  constructor() {
    super('pCont');
  }

}



console.log('instanciate');
const cont = new RootCont();



function S(o) {
  const res  = [];
  for (const a in o) {
    res.push([a, o[a]]);
  }
  return res;
  // return Object.keys(o);
  // return JSON.stringify(o);
}

console.log(S(cont));


console.log('setting');
cont.num.set( 6);



console.log(cont.num.computeAddress());
