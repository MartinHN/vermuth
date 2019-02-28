var DMX = require ('dmx')
var SerialPort = require('serialport')
const OSCDriver = require('./dmxOSCDriver')


class DMXController{
  public portName= "";
  public driverName= "enttec-open-usb-dmx";
  public connected = false;

  private dmx:any;
  private universeName = "main";
  private availableDevices:any;
  private socket:any;

  static getAvailableDevices(){
    return SerialPort.list()//.filter(c=>c).map(c=>c.commName)
    
  }
  constructor(){
    this.dmx = new DMX()
    this.dmx.registerDriver('QLC',OSCDriver)
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
      if(this.connectToDevice()){
        if(cb){cb(msg);}
        socket.emit('DMX/SET_PORTNAME',msg)
      }
      else{
        socket.emit('DMX/SET_PORTNAME',"")
      }
    })
    socket.on('DMX/GET_DRIVERLIST',(cb:Function) =>{
      const pl = Object.keys(this.dmx.drivers)
      if(cb){cb(pl)}
        socket.emit("DMX/SET_DRIVERLIST",pl)

    })
    socket.on('DMX/GET_ISCONNECTED',()=>{socket.emit('DMX/SET_ISCONNECTED',this.connected)})

    socket.on('DMX/SET_DRIVERNAME',(msg:string,cb:Function) =>{
      this.driverName=msg
      if(this.connectToDevice()){
        if(cb){cb(msg);}
        socket.emit('DMX/SET_DRIVERNAME',msg)
      }
      else{
        socket.emit('DMX/SET_DRIVERNAME',"")
      }
    })

    socket.on('DMX/SET_CIRC',(msg) => {
      console.log('set_circ',msg,this.connected)
      if(this.connected){
        // this.dmx.updateAll(this.universeName,msg[0].v)
        this.dmx.update(this.universeName,this.arrayToObj(msg))
      }
    })
  }

  arrayToObj(a:{c:number,v:number}[]){
    const res = {}
    for(const e of a ){
      res[e.c] = e.v
    }
    console.log(res)
    return res;
  }

  connectToDevice(options = {}){
    options['universe']=1
    if(this.connected){
      this.dmx.universes[this.universeName].stop();
      this.dmx.universes[this.universeName].close(()=>{this.connected=false;this.connectToDevice(options);});
      return false;
    }
    const uri = this.portName+":"+this.driverName
    console.log('trying to connect to '+uri)
    let uni;
    try{
     uni = this.dmx.addUniverse(this.universeName, this.driverName, this.portName|| "", options)
     if(uni && uni.dev && ('isOpen' in uni.dev))
      {this.connected = uni.dev.isOpen}
    else{
      this.connected = true;
    }
  }catch{
    this.connected = false;
  }
    
    if(this.connected){console.log('successfully connected to '+uri);}
    else{console.log('cant connected to '+uri);}
    this.socket.emit('DMX/SET_ISCONNECTED',this.connected)
    return this.connected
  }
}

export default new DMXController()