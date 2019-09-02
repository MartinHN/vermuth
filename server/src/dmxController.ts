var DMX = require ('dmx')
var SerialPort = require('serialport')
const OSCDriver = require('./dmxOSCDriver')
const needCustomPiLibs = process.env.CUSTOM_PI_DRIVERS
const GPIODriver = require('./dmxGPIODriver')
const SolenoidDriver = require('./dmxSolenoidDriver')

var io = require('socket.io')
import log from './remoteLogger'
const isPi = require('detect-rpi')();
import { Universe } from "@API/Universe"
import {UniverseListener} from "@API/Channel"
import rootState from "@API/RootState"
import DMXControllerI from "@API/DMXControllerI"
import { AccessibleClass,nonEnumerable,RemoteValue } from "@API/ServerSync"





@AccessibleClass()
class DMXController implements DMXControllerI{
  @RemoteValue((self,n:string)=>{
    self.connectToDevice()

  })
  public selectedPortName= "";
  
  @RemoteValue()
  public portNameList = new Array<string>();
  
  @RemoteValue((self,n:string)=>{
    if(n){
      self.connectToDevice()
    }
  })
  public selectedDriverName= isPi?"dmxGPIODriver":"enttec-usb-dmx-pro";
  
  @RemoteValue()
  @nonEnumerable()
  public driverList = new Array<string>();

  @RemoteValue()
  public __connected = false;

  @nonEnumerable()
  private dmx = new DMX();

  private universeName = "main";
  @nonEnumerable()
  private availableDevices:any;
  @nonEnumerable()
  private __sockets:any = {};
  @nonEnumerable()
  private __ioServer:any;
  @nonEnumerable()
  private __universe:Universe;

  @nonEnumerable()
  private __portWatch:any;
  // @nonEnumerable()
  // private fixtures : {[id:string] : {[id:string]:number}} = {};

  public registerAvailableDevices(){
    return new Promise((resolve,reject)=>{
      SerialPort.list().then((l)=>{
        this.availableDevices = l;
        this.portNameList = l.map(c=>c.comName);
        
        resolve(l)
        // console.log(this.portNameList);
      }).
      catch(e=>{
        console.error(e)
        reject(e)
      })
    })
  }



  constructor(){

    this.dmx.registerDriver('QLC',OSCDriver)
    if(needCustomPiLibs){
      this.dmx.registerDriver('GPIO',GPIODriver)
      this.dmx.registerDriver('Solenoid',SolenoidDriver)
    }
    delete this.dmx.drivers['bbdmx']
    this.watchSerialPorts()
    this.driverList = Object.keys(this.dmx.drivers)
    UniverseListener.on('channelChanged', (c,v)=>{this.setCircs([{c,v}],null)});

  }

  broadcastState(){
    // this.ioServer.broadcast("SET_STATE",rootState)
  }
  configureFromObj(o:any){
    for(const k in this){
      if(o[k] && k!=="driverList" && k!=="portNameList"){
        this[k] = o[k]
      }
    }
  }

  watchSerialPorts(){
    if(!this.__portWatch){
      const fn = ()=>{
        this.registerAvailableDevices().then(()=>{
          if(!this.__connected && this.selectedPortName in this.portNameList){
            this.connectToDevice()
          }
          
        })
      }
      fn()
      this.__portWatch = setInterval(fn,2000)
    }

  }
  stopWatchSerialPorts(){
    if(this.__portWatch){
      clearInterval(this.__portWatch)
      this.__portWatch = null
    }
  }
  register(ioServer:any,uni:Universe){
    this.__universe = uni
    this.__ioServer = ioServer

    ioServer.on('connection', function(socket){
      this.__sockets[socket.id] = socket;

      socket.on('disconnect',()=>{
        delete this.__sockets[socket.id]
      })
    }.bind(this))
  }

  setAllColor(color:{r:number,g:number,b:number}){
    if(this.__universe){
      this.__universe.setAllColor(color)
    }
  }
  setCircs(msg:{c:number,v:number}[],fromSocket){
    // console.log('set_circ',msg,this.__connected)

    const allC = this.__universe.allChannels
    // msg.map(m=>{allC.map(cc=>{if(cc.circ === m.c){cc.setValue(m.v,false)}})})
    // this.dmx.updateAll(this.universeName,msg[0].v)
    if(!this.__connected){
      console.error("dmx not connected")
      // debugger

    }else{

      this.dmx.update(this.universeName,this.arrayToObj(msg,255))
    }
    
    if(fromSocket){
      fromSocket.broadcast.emit("DMX/SET_CIRC",msg)
      console.log('form_',fromSocket.id)
    }
    else{
      //if(this.__ioServer)this.__ioServer.emit("DMX/SET_CIRC",msg)
    }



  }




  arrayToObj(a:{c:number,v:number}[],mult:number=1){
    const res = {}
    for(const e of a ){
      res[e.c] = e.v*mult
    }
    //console.log(res)
    return res;
  }

  get activeChannels(){
    return rootState.universe.fixtureList.map(e=>e.channels).flat()
  }

  connectToDevice(options?:any){
    options = options || {}
    options['universe']=1
    if(this.__connected){
      this.dmx.universes[this.universeName].stop();
      this.dmx.universes[this.universeName].close(()=>{
        this.__connected=false;
        this.connectToDevice(options);});
      return false;
    }
    const uri = this.selectedPortName+":"+this.selectedDriverName
    if(!this.selectedDriverName){
      console.error('no device selected for enttec')
      return
    }
    if((""+this.selectedDriverName).startsWith("enttec") && !this.selectedPortName && this.selectedPortName!=="none"){
      console.error('no device selected for enttec')
      return
    }
    console.log('trying to connect to '+uri)
    let uni;
    const successCB = ()=>{
      this.stopWatchSerialPorts()
      this.__connected = true
      console.log('successfully connected to '+uri);
      this.dmx.update(this.universeName,this.activeChannels.map(c=>{return [c.trueCirc,c.intValue]}))
      

      // if(this.__ioServer)this.__ioServer.emit('DMX/SET_ISCONNECTED',this.__connected);
    }
    const closeCB = ()=>{
      console.log('connection closed '+uri);
      this.__connected = false;
      // this.selectedDriverName = ""

    }
    const errorCB = () =>{
      this.watchSerialPorts()
      console.log('cant connect to '+uri);
      this.__connected = false;
      this.dmx.universes[this.universeName].stop();
      this.dmx.universes[this.universeName].close(closeCB)
      // this.selectedDriverName = ""

    }
    
    try{
      uni = this.dmx.addUniverse(this.universeName, this.selectedDriverName, this.selectedPortName|| "", options)
      //log.log("universe "+JSON.stringify(uni))
      if(uni && uni.dev && uni.dev.on){
        uni.dev.on('open',successCB);
        uni.dev.on('error',errorCB);
        uni.dev.on('close',closeCB);
      }
      else{
        successCB()
      }
    }catch(ex){
      log.error(ex)
      errorCB();

    }

  }
}

export default new DMXController()