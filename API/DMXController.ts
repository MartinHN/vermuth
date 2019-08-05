import { Universe } from "@API/Universe"
const isClient = process.env.VUE_APP_ISCLIENT
let isPi = false
if(isClient){
  isPi = require('detect-rpi')();
}

import { RemoteFunction ,AccessibleClass } from './ServerSync'

@AccessibleClass()
class DMXController{

  public portName= "";
  public driverName= isPi?"dmxGPIODriver":"enttec-usb-dmx-pro";
  public connected = false;
  private __availableDevices:any;
  private dmx:any;
  private universeName = "main";
  
  private __sockets:any = {};
  private __ioServer:any;
  private __universe:Universe;
  private fixtures : {[id:string] : {[id:string]:number}} = {};

  @RemoteFunction()
  static getAvailableDevices(){
    return SerialPort.list()//.filter(c=>c).map(c=>c.commName)
    
  }
  constructor(){
    this.dmx = new DMX()
    this.dmx.registerDriver('QLC',OSCDriver)
    this.dmx.registerDriver('GPIO',GPIODriver)
    this.dmx.registerDriver('Solenoid',SolenoidDriver)
    delete this.dmx.drivers['bbdmx']
    DMXController.getAvailableDevices().then((v,err)=>{
      if(err){console.error(err);}
      else{this.__availableDevices = v;console.log('available devices',JSON.stringify(v))}
    })
    
  }
  @RemoteFunction()
  setCircs(msg:{c:number,v:number}[],fromSocket){
    console.log('set_circ',msg,this.connected)
    if(this.connected){
      const allC = this.__universe.allChannels
      msg.map(m=>{allC.map(cc=>{if(cc.circ === m.c){cc.setValue(m.v,false)}})})
      // this.dmx.updateAll(this.universeName,msg[0].v)
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

  connectToDevice(cb:(msg:string)=>void,options = {}){
    options['universe']=1
    if(this.connected){
      this.dmx.universes[this.universeName].stop();
      this.dmx.universes[this.universeName].close(()=>{
        this.connected=false;
        this.connectToDevice(cb,options);});
      return false;
    }
    const uri = this.portName+":"+this.driverName
    console.log('trying to connect to '+uri)
    let uni;
    const successCB = ()=>{
      console.log('successfully connected to '+uri);
      this.connected = true;cb('open');
      if(this.__ioServer)this.__ioServer.emit('DMX/SET_ISCONNECTED',this.connected);
    }
    const errorCB = () =>{
      console.log('cant connected to '+uri);
      this.connected = false;
      cb('close');
      if(this.__ioServer){this.__ioServer.emit('DMX/SET_ISCONNECTED',this.connected);}
    }
    try{
      uni = this.dmx.addUniverse(this.universeName, this.driverName, this.portName|| "", options)
      log.log("universe "+JSON.stringify(uni))
      if(uni && uni.dev){
        uni.dev.on('open',successCB);
        uni.dev.on('error',errorCB);
        uni.dev.on('close',errorCB);
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