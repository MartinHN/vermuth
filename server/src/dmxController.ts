const DMX = require ('dmx');
const SerialPort = require('serialport');
const OSCDriver = require('./dmxOSCDriver');
const needCustomPiLibs = process.env.CUSTOM_PI_DRIVERS;
const GPIODriver = require('./dmxGPIODriver');
const SolenoidDriver = require('./dmxSolenoidDriver');
const LoggerDriver = require('./dmxLoggerDriver');
import * as _ from 'lodash';

const io = require('socket.io');
import log from './remoteLogger';
const isPi = require('detect-rpi')();
import { Universe } from '@API/Universe';
import {UniverseListener} from '@API/Channel';
import rootState from '@API/RootState';
import { DMXControllerI, needSerialPort } from '@API/DMXControllerI';
import { AccessibleClass, nonEnumerable, RemoteValue } from '@API/ServerSync';





@AccessibleClass()
class DMXController implements DMXControllerI {

  get activeChannels() {
    return rootState.universe.fixtureList.map((e) => e.channels).flat();
  }
  @RemoteValue((self, n: string) => {
    self.connectToDevice();

  })
  public selectedPortName = '';

  @RemoteValue()
  public portNameList = new Array<string>();

  @RemoteValue((self, n: string) => {
    if (n) {
      self.connectToDevice();
    }
  })
  public selectedDriverName = isPi ? 'dmxGPIODriver' : 'enttec-usb-dmx-pro';

  @RemoteValue()
  @nonEnumerable()
  public driverList = new Array<string>();

  @RemoteValue()
  public __connected = false;

  @nonEnumerable()
  private dmx;

  private universeName = 'main';
  @nonEnumerable()
  private availableDevices: any;
  @nonEnumerable()
  private __sockets: any = {};
  @nonEnumerable()
  private __ioServer: any;
  @nonEnumerable()
  private __universe: Universe;

  @nonEnumerable()
  private __portWatch: any;



  constructor() {

    this.dmx = new DMX();
    this.dmx.registerDriver('QLC', OSCDriver);
    this.dmx.registerDriver('Logger', LoggerDriver);
    if (needCustomPiLibs) {
      this.dmx.registerDriver('GPIO', GPIODriver);
      this.dmx.registerDriver('Solenoid', SolenoidDriver);
    }
    delete this.dmx.drivers.bbdmx;
    delete this.dmx.drivers.null;
    this.watchSerialPorts();
    this.driverList = Object.keys(this.dmx.drivers);
    UniverseListener.on('channelChanged', (c, v) => {this.setCircs([{c, v}], null); });

  }
  // @nonEnumerable()
  // private fixtures : {[id:string] : {[id:string]:number}} = {};

  public registerAvailableDevices() {
    return new Promise((resolve, reject) => {
      SerialPort.list().then((l) => {
        this.availableDevices = l;
        this.portNameList = l.map((c) => c.comName);

        resolve(l);
        // console.log(this.portNameList);
      }).
      catch((e) => {
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
      if (o[k] && k !== 'driverList' && k !== 'portNameList' && Object.getOwnPropertyDescriptor(o, k).enumerable) {
        this[k] = o[k];
      }
    }
  }

  public watchSerialPorts() {
    if (!this.__portWatch) {
      const fn = () => {
        this.registerAvailableDevices().then(() => {
          if (!this.__connected && this.selectedPortName in this.portNameList) {
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

    ioServer.on('connection', function(socket) {
      this.__sockets[socket.id] = socket;

      socket.on('disconnect', () => {
        delete this.__sockets[socket.id];
      });
    }.bind(this));
  }

  public setAllColor(color: {r: number, g: number, b: number}) {
    if (this.__universe) {
      this.__universe.setAllColor(color);
    }
  }
  public setCircs(msg: Array<{c: number, v: number}>, fromSocket) {
    // console.log('set_circ',msg,this.__connected)

    const allC = this.__universe.allChannels;
    // msg.map(m=>{allC.map(cc=>{if(cc.circ === m.c){cc.setValue(m.v,false)}})})
    // this.dmx.updateAll(this.universeName,msg[0].v)
    if (!this.__connected) {
      _.debounce(() => {console.error('dmx not connected'); }, 500);
      // debugger

    } else {

      this.dmx.update(this.universeName, this.arrayToObj(msg, 255));
    }

    if (fromSocket) {
      fromSocket.broadcast.emit('DMX/SET_CIRC', msg);
      console.log('form_', fromSocket.id);
    } else {
      // if(this.__ioServer)this.__ioServer.emit("DMX/SET_CIRC",msg)
    }



  }




  public arrayToObj(a: Array<{c: number, v: number}>, mult: number= 1) {
    const res = {};
    for (const e of a ) {
      res[e.c] = e.v * mult;
    }
    // console.log(res)
    return res;
  }

  public connectToDevice(options?: any) {
    options = options || {};
    options.universe = 1;
    let uni;
    const successCB = () => {
      this.stopWatchSerialPorts();
      this.__connected = true;
      console.log('successfully connected to ' + uri);
      this.dmx.update(this.universeName, this.activeChannels.map((c) => [c.trueCirc, c.intValue]));
    };
    const closeCB = () => {
      console.log('connection closed ' + uri);
      this.__connected = false;
    };

    const errorCB = () => {
      this.watchSerialPorts();
      console.log('cant connect to ' + uri);
      this.__connected = false;
      if ( this.dmx.universes[this.universeName]) {
        this.dmx.universes[this.universeName].stop();
        this.dmx.universes[this.universeName].close(closeCB);
      }
    };
    if (this.__connected && this.dmx.universes[this.universeName]) {
      const cuni = this.dmx.universes[this.universeName];

      if (cuni && cuni.dev && cuni.dev.removeAllListeners) {
        cuni.dev.removeAllListeners('open');
        cuni.dev.removeAllListeners('error');
        cuni.dev.removeAllListeners('close');
      }

      this.dmx.universes[this.universeName].stop();
      this.dmx.universes[this.universeName].close(() => {
        this.__connected = false;
        this.connectToDevice(options); });
      return false;
    }

    const uri = this.selectedPortName + ':' + this.selectedDriverName;
    if (!this.selectedDriverName) {
      console.error('no device selected for enttec');
      this.__connected = false;
      return;
    }
    if (needSerialPort(this.selectedDriverName) && !this.selectedPortName && this.selectedPortName !== 'none') {
      console.error('no device selected for enttec');
      this.__connected = false;
      return;
    }
    console.log('trying to connect to ' + uri);


    // this.selectedDriverName = ""



    try {
      uni = this.dmx.addUniverse(this.universeName, this.selectedDriverName, this.selectedPortName || '', options);
      // log.log("universe "+JSON.stringify(uni))
      if (uni && uni.dev && uni.dev.on) {
        uni.dev.on('open', successCB);
        uni.dev.on('error', errorCB);
        uni.dev.on('close', closeCB);
      } else {
        successCB();
      }
    } catch (ex) {
      log.error(ex);
      errorCB();

    }

  }
}

export default new DMXController();
