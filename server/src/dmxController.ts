var DMX = require ('dmx')
var SerialPort = require('serialport')
const OSCDriver = require('./dmxOSCDriver')
const GPIODriver = require('./dmxGPIODriver')
const SolenoidDriver = require('./dmxSolenoidDriver')
var io = require('socket.io')
import log from './remoteLogger'
const isPi = require('detect-rpi')();

class DMXController{
  public portName= "";
  public driverName= isPi?"dmxGPIODriver":"enttec-open-usb-dmx";
  public connected = false;

  private dmx:any;
  private universeName = "main";
  private availableDevices:any;
  private socket:any;
  private fixtures : {[id:string] : {[id:string]:number}} = {};

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
      else{this.availableDevices = v;console.log('available devices',JSON.stringify(v))}
    })
    
  }

  register(socket:any){
    this.socket = socket;
    socket.on('DMX/GET_PORTLIST',(cb:Function) =>{
      DMXController.getAvailableDevices().then(
        (pl,err)=>{
          if(cb){cb(pl)}
            socket.emit("DMX/SET_PORTLIST",pl)
        });
    })

    socket.on('DMX/SET_PORTNAME',(msg:string,cb:Function) =>{
      this.portName = msg;
      this.connectToDevice((state:string)=>{
        if(state === 'open'){
          if(cb){cb(msg);}
          socket.emit('DMX/SET_PORTNAME',msg)
        }
        else{
          socket.emit('DMX/SET_PORTNAME',"")
        }
      })
    })
    socket.on('DMX/GET_DRIVERLIST',(cb:Function) =>{
      const pl = Object.keys(this.dmx.drivers)
      if(cb){cb(pl)}
        socket.emit("DMX/SET_DRIVERLIST",pl)

    })
    socket.on('DMX/GET_ISCONNECTED',()=>{socket.emit('DMX/SET_ISCONNECTED',this.connected)})

    socket.on('DMX/SET_DRIVERNAME',(msg:string,cb:Function) =>{
      this.driverName=msg
      this.connectToDevice((state:string)=>{
        if(state === 'open'){
          if(cb){cb(msg);}
          socket.emit('DMX/SET_DRIVERNAME',msg);
        }
        else{
          socket.emit('DMX/SET_DRIVERNAME',"")
        }
      })
    })

    socket.on('DMX/GET_DRIVERNAME',(msg:string,cb:Function) =>{
      socket.emit('DMX/SET_DRIVERNAME',this.driverName);
    })
    socket.on('DMX/GET_PORTNAME',(msg:string,cb:Function) =>{
      socket.emit('DMX/SET_PORTNAME',this.portName);
    })

    socket.on('DMX/SET_CIRC',(msg) => {
      this.setCircs(msg,socket)
    })
  }

  setCircs(msg:{c:number,v:number}[],fromSocket){
    console.log('set_circ',msg,this.connected)
    if(this.connected){
      // this.dmx.updateAll(this.universeName,msg[0].v)
      this.dmx.update(this.universeName,this.arrayToObj(msg,255))
    }
    if(fromSocket){
      fromSocket.broadcast.emit("DMX/SET_CIRC",msg)
    }
    else{
      this.socket.server.emit("DMX/SET_CIRC",msg)
    }


  }
  setChannelsFromId(msg:{id:string,v:number},fromSocket){
    console.log('set_fixture',msg,this.connected)
    if(this.connected && msg.id){
      // this.dmx.updateAll(this.universeName,msg[0].v)
      const nSpl = msg.id.split(':')
      if(nSpl  && nSpl.length>=2){
        const fix = this.fixtures[nSpl[0]]
        if(fix){
          const cN = fix[nSpl[1]]
          this.setCircs([{c:cN,v:msg.v}],fromSocket)
        }
        else{
          log.error('not found fixture/channel : '+msg.id)
        }
      }

      else if(Object.keys(this.fixtures).includes(msg.id)){
        const channels = []
        for(let c in this.fixtures[msg.id]){
          channels.push({c:this.fixtures[msg.id][c],v:msg.v})
        }
        this.setCircs(channels,fromSocket)
      }
      else{
        for(let fN in this.fixtures){
          const f = this.fixtures[fN]
          for(let c in f){
            if(c===msg.id){
              this.setCircs([{c:f[c],v:msg.v}],fromSocket)
            }
          }
        }
      }
      
    }
  }


  // quick hack to get fixture config
  stateChanged(a:any){
    if(a && a.fixtures && a.fixtures.universe){
      this.fixtures = {};
      const fixtures = a.fixtures.universe.fixtures
      for(let f of fixtures){
        this.fixtures[f.name] = {}
        for (let c of f.channels){
          this.fixtures[f.name][c.name] = c.circ;
        }

      }
      console.log("fixtures : "+JSON.stringify(this.fixtures))

    }
    else{
      log.error("can't sync server state with : "+JSON.stringify(a))
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
      this.connected = true;cb('open');this.socket.emit('DMX/SET_ISCONNECTED',this.connected)
    }
    const errorCB = () =>{
      console.log('cant connected to '+uri);
      this.connected = false;
      cb('close');
      this.socket.emit('DMX/SET_ISCONNECTED',this.connected)
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