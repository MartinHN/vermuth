const osc = require('osc');


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

  connect(port){
    const udpPort = new osc.UDPPort({
      localAddress: "0.0.0.0",
      localPort: port
    });

    udpPort.on("ready", function () {
      var ipAddresses = getIPAddresses();
      console.log("Listening for OSC over UDP.");
      ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udpPort.options.localPort);
      });
    });
    udpPort.on("bundle", function (bundle) {
      for(let i in bundle){this.processMsg(bundle[i])}
    })
    udpPort.on("message", this.processMsg);

    udpPort.on("error", function (err) {
      console.error(err);
    });
    this.udpPort = udpPort

    
    udpPort.open();
    
  }

  processMsg (msg) {
      if(msg.address==="/circ"){
        dmxController.setCircs([{c:msg.args[0],v:msg.args[1]}])
      }
    }
}

export default new OSCServer();