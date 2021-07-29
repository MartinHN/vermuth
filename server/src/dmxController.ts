const DMX = require('dmx');
const SerialPort = require('serialport');
import dbg from '@API/dbg'
const debugDMX = dbg('DMX')
// const debugDMX = console.warn

const OSCDriver = require('./dmxOSCDriver');
const needCustomPiLibs = process.env.CUSTOM_PI_DRIVERS;
const isPi = require('detect-rpi')();

// const GPIODriver = require('./dmxGPIODriver');
// const SolenoidDriver = require('./dmxSolenoidDriver');

const LoggerDriver = require('./dmxLoggerDriver');
const SACNDriver = require('./dmxSACNDriver');
const _ = require('lodash');

const io = require('socket.io');
import log from './remoteLogger';

import {Universe} from '@API/Universe';
import {UniverseListener} from '@API/Channel';
import rootState from '@API/RootState';
import {DMXControllerI, needSerialPort} from '@API/DMXControllerI';
import {AccessibleClass, nonEnumerable, RemoteValue} from '@API/ServerSync';
import { kMaxLength } from 'buffer';

let lastCircUpdate = 0;

@AccessibleClass()
class DMXController implements DMXControllerI {
  get activeChannels() {
    return rootState.universe.allChannels;
  }
  @RemoteValue((self, n: string) => {
    self.connectToDevice();
  })
  public selectedPortName = '';

  @RemoteValue() public __portNameList = new Array<string>();

  @RemoteValue((self, n: string) => {
    if (n) {
      self.connectToDevice();
    }
  })
  public selectedDriverName = isPi ? 'dmxGPIODriver' : 'enttec-usb-dmx-pro';

  @RemoteValue() public __driverNameList = new Array<string>();

  @RemoteValue() public __connected = false;

  @nonEnumerable() private dmx: any;

  private universeName = 'main';
  @nonEnumerable() private __availableDevices: any;
  @nonEnumerable() private __sockets: any = {};
  @nonEnumerable() private __ioServer: any;
  @nonEnumerable() private __universe?: Universe;

  @nonEnumerable() private __portWatch: any;

  private __debouncedQueue: {[id: string]: number} = {}

  postToQueue(c: any, v: number) {
    if (Object.keys(this.__debouncedQueue).length > 0) {
      debugDMX('coalescing circs', Object.keys(this.__debouncedQueue).length);
    }
    this.__debouncedQueue[c.toString()] = v;
    this.updateCircs()
  }
  updateCircs = _.debounce(() => {
    if (Object.keys(this.__debouncedQueue).length > 0) {
      const now = new Date().getTime();
      debugDMX('sending circs', now - lastCircUpdate);
      lastCircUpdate = now;
    }
    const circsV: {c: number; v: number}[] = [];
    Object.entries(this.__debouncedQueue)
        .map((kv) => {circsV.push({c: parseInt(kv[0]), v: kv[1]})});
    this.setCircs(circsV, null);
    this.__debouncedQueue = {};
  }, 2, {maxWait: 10})
  constructor() {
    this.dmx = new DMX();
    this.dmx.registerDriver('QLC', OSCDriver);
    this.dmx.registerDriver('Logger', LoggerDriver);
    this.dmx.registerDriver('SACN', SACNDriver);
    
    // if (needCustomPiLibs) {
    //   this.dmx.registerDriver('GPIO', GPIODriver);
    //   this.dmx.registerDriver('Solenoid', SolenoidDriver);
    // }
    delete this.dmx.drivers.bbdmx;
    delete this.dmx.drivers.null;
    this.watchSerialPorts();
    this.__driverNameList = Object.keys(this.dmx.drivers);
    console.log('drivers : ', this.__driverNameList);
    UniverseListener.on(
        'channelChanged',
        (c: any, v: number) => {// this.setCircs([{ c, v }], null);
                                this.postToQueue(c, v)});
  }
  // @nonEnumerable()
  // private fixtures : {[id:string] : {[id:string]:number}} = {};

  public registerAvailableDevices() {
    return new Promise((resolve, reject) => {
      SerialPort.list()
          .then((l: any) => {
            this.__availableDevices = l;
            if (l.length !== this.__portNameList.length) {
              // broadcast(this.__portNameList)
              // debugger
            }
            this.__portNameList = l.map((c: any) => c.path);

            resolve(l);
            // debug(this.__portNameList);
          })
          .catch((e: any) => {
            console.error(e);
            reject(e);
          });
    });
  }

  public broadcastState() {
    // this.ioServer.broadcast("SET_STATE",rootState)
  }
  public configureFromObj(o: any) {
    for (const k in this) {
      if (o[k] && k !== '__driverNameList' && k !== '__portNameList' &&
          o.propertyIsEnumerable(k)) {
        this[k] = o[k];
      }
    }
  }

  public watchSerialPorts() {
    if (!this.__portWatch) {
      const fn = () => {
        this.registerAvailableDevices().then(() => {
          if (!this.__connected &&
              this.selectedPortName in this.__portNameList) {
            this.connectToDevice();
          }
        });
      };
      fn();
      this.__portWatch = setInterval(fn, 2000);
    }
  }
  public stopWatchSerialPorts() {
    if (this.__portWatch) {
      clearInterval(this.__portWatch);
      this.__portWatch = null;
    }
  }
  public register(ioServer: any, uni: Universe) {
    this.__universe = uni;
    this.__ioServer = ioServer;

    ioServer.on('connection', (socket) => {
      this.__sockets[socket.id] = socket;

      socket.on('disconnect', () => {
        delete this.__sockets[socket.id];
      });
    });
  }

  public setAllColor(
      color: {r: number; g: number; b: number}, setWhiteToZero: boolean) {
    if (this.__universe) {
      this.__universe.setAllColor(color, setWhiteToZero);
    }
  }

  public setCircs(msg: Array<{c: number; v: number}>, fromSocket) {
    // const allC = this.__universe.allChannels;
    // msg.map(m=>{allC.map(cc=>{if(cc.circ === m.c){cc.setValue(m.v,false)}})})
    // this.dmx.updateAll(this.universeName,msg[0].v)
    if (!this.__connected) {
      _.debounce(() => {
        console.error('dmx not connected');
      }, 500);
      // debugger

    } else {
      this.dmx.update(this.universeName, this.arrayToObj(msg, 255, true));
    }

    if (fromSocket) {
      fromSocket.broadcast.emit('DMX/SET_CIRC', msg);
      debugDMX('form_', fromSocket.id);
    } else {
      // if(this.__ioServer)this.__ioServer.emit("DMX/SET_CIRC",msg)
    }
  }



  public arrayToObj(
      a: Array<{c: number; v: number}>, mult = 1, castInt = false) {
    const res = {};
    for (const e of a) {
      if (isNaN(e.c) || isNaN(e.v)) {
        debugger;
        continue;
      }
      res[e.c] = e.v * mult;
      if (castInt) {
        res[e.c] = parseInt(res[e.c])
      }
    }
    // debug(res)
    return res;
  }

  public connectToDevice(options?: any) {
    if (!this.__driverNameList.find((e) => e === this.selectedDriverName)) {
      console.error(
          'can\'t connect to unknown driver ' + this.selectedDriverName);
      return;
    }
    options = options || {};
    options.universe = 1;
    let uni;
    const successCB = () => {
      this.stopWatchSerialPorts();
      this.__connected = true;
      debugDMX('successfully connected to ' + uri);
      this.dmx.update(
          this.universeName,
          this.arrayToObj(this.activeChannels.map(
              (c) => ({c: c.trueCirc, v: c.intValue}))));
    };
    const closeCB = () => {
      this.watchSerialPorts();
      debugDMX('connection closed ' + uri);
      this.__connected = false;
    };

    const errorCB = (e = undefined) => {
      this.watchSerialPorts();
      console.error('cant connect to ' + uri);
      if (e) {
        console.error(e);
      }
      this.__connected = false;
      try {
        const cuni = this.dmx.universes[this.universeName];
        if (cuni && cuni.dev && cuni.dev.removeAllListeners) {
          cuni.dev.removeAllListeners('error');  // avoid recursion
        }
        if (this.dmx.universes[this.universeName]) {
          this.dmx.universes[this.universeName].stop();
          this.dmx.universes[this.universeName].close(closeCB);
        }
      } catch (ex) {
        console.error('can\'t close device', ex);
        console.error(ex);
      }
    };


    let uri =  this.selectedPortName + ':' + this.selectedDriverName;
    if (this.__connected && this.dmx.universes[this.universeName]) {
      const cuni = this.dmx.universes[this.universeName];

      if (cuni && cuni.dev && cuni.dev.removeAllListeners) {
        cuni.dev.removeAllListeners('open');
        cuni.dev.removeAllListeners('error');
        cuni.dev.removeAllListeners('close');
      }
      
      this.dmx.universes[this.universeName].stop();
      const reconnectCB = () => {
        this.__connected = false;
        this.connectToDevice(options);
      };
      try {
        this.dmx.universes[this.universeName].close(reconnectCB);
      } catch (ex) {
        console.error('can\'t close device', ex);
        reconnectCB();
      }
      return false;
    }
    
    if (!this.selectedDriverName) {
      console.error('no device selected for enttec');
      this.__connected = false;
      return;
    }
    if (needSerialPort(this.selectedDriverName) && !this.selectedPortName &&
    this.selectedPortName !== 'none') {
      console.error('no device selected for enttec');
      this.__connected = false;
      return;
    }
    let deviceId = this.selectedPortName || ''
    if(this.selectedDriverName == "artnet"){
      deviceId = "2.255.255.255" 
      // options.dmx_speed = 1;
    }
    
    uri =  deviceId + ':' + this.selectedDriverName;
     
    debugDMX('trying to connect to ' + uri);


    // this.selectedDriverName = ""

    try {
      uni = this.dmx.addUniverse(
          this.universeName, this.selectedDriverName,
          deviceId, options);
          debugDMX("universe ",uni.dev && uni.dev.on,JSON.stringify(uni.dev.on))
          if (uni && uni.dev && uni.dev.on && this.selectedDriverName!=="artnet") {
            uni.dev.on('open', successCB);
            uni.dev.on('error', errorCB);
            uni.dev.on('close', closeCB);
          } else {
        successCB();
      }
    } catch (ex) {
      log.error('can\'t open device ' + ex);
      errorCB();
    }
  }
}

export default new DMXController();
