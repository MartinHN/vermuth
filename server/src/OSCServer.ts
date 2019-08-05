const osc = require('osc');
import rootState from '@API/RootState'


/****************
 * OSC Over UDP *
 ****************/

 var getIPAddresses = function () {
  var os = require("os"),
  interfaces = os.networkInterfaces(),
  ipAddresses = [];

  for (var deviceName in interfaces) {
    var addresses = interfaces[deviceName];
    for (var i = 0; i < addresses.length; i++) {
      var addressInfo = addresses[i];
      if (addressInfo.family === "IPv4" && !addressInfo.internal) {
        ipAddresses.push(addressInfo.address);
      }
    }
  }

  return ipAddresses;
};



//import {getter, setter} from './types'
import dmxController from './dmxController'
import log from './remoteLogger'

class OSCServer{
  udpPort:any

  connect(port,broadcast = false){
    let ip = "0.0.0.0"
    if(broadcast){
      // ip = "239.0.0.56"
      ip = "10.31.15.255"
    }
    const udpPort = new osc.UDPPort({
      localAddress: ip,// broadcast//0.0.0.0",
      localPort: port,
      broadcast,
    });
    console.log(`listening on ${ ip } : ${ port }`)

    udpPort.on("ready", function () {
      var ipAddresses = getIPAddresses();
      console.log("Listening for OSC over UDP.");
      ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udpPort.options.localPort);
      });
    });
    udpPort.on("bundle", this.processBundle);
    udpPort.on("message", this.processMsg);

    udpPort.on("error", function (err) {
      console.error(err);
    });
    this.udpPort = udpPort


    udpPort.open();
    
  }

  processMsg (msg,time,info) {

    rootState.callMethod(msg.address,msg.args)
    // if(msg.address==="/circ"){
    //   dmxController.setCircs([{c:msg.args[0],v:msg.args[1]}],null)
    // }
    // else if(msg.address==="/channel"){
    //   dmxController.setChannelsFromId({id:msg.args[0],v:msg.args[1]},null)
    // }
    // else if(msg.address==="/ping"){
    //   console.log('rcvd ping from '+JSON.stringify(info));
    //    this.udpPort.send({address:"/pong",args:[]},info.address,info.port)
    // }
    // else if(msg.address==="/seq"){
    //   // TODO
    //   RootState.
    // }
  }

  processBundle(b,time,info){
    for(let i in b.packets){
      const p = b.packets[i]
      if(p.packets){this.processBundle(p,time,info);}
      else{this.processMsg(p,time,info);}
    }
  }

}

export default new OSCServer();