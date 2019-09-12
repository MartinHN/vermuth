const osc = require('osc');

import rootState from '@API/RootState';
import { callAnyAccessibleFromRemote } from '@API/ServerSync';
const logClientMessages = process.env.LOG_MSG;
const clientLogger = logClientMessages ? require('@API/Logger').default : undefined;
/****************
 * OSC Over UDP *
 ****************/

const getIPAddresses = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const ipAddresses = [];

  for (const deviceName of Object.keys(interfaces) ) {
    const addresses = interfaces[deviceName];
    for (const addressInfo of addresses) {
      if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
        ipAddresses.push(addressInfo.address);
      }
    }
  }

  return ipAddresses;
};



// import {getter, setter} from './types'
import dmxController from './dmxController';
import log from './remoteLogger';

class OSCServer {
  public udpPort: any;

  public connect(port, broadcast = false) {
    let ip = '0.0.0.0';
    if (broadcast) {
      // ip = "239.0.0.56"
      ip = '10.31.15.255';
    }
    const udpPort = new osc.UDPPort({
      localAddress: ip, // broadcast//0.0.0.0",
      localPort: port,
      broadcast,
    });
    console.log(`listening on ${ ip } : ${ port }`);

    udpPort.on('ready', () => {
      const ipAddresses = getIPAddresses();
      console.log('Listening for OSC over UDP.');
      ipAddresses.forEach((address) => {
        console.log(' Host:', address + ', Port:', udpPort.options.localPort);
      });
    });
    udpPort.on('bundle', this.processBundle.bind(this));
    udpPort.on('message', this.processMsg.bind(this));

    udpPort.on('error', (err) => {
      console.error(err);
    });
    this.udpPort = udpPort;


    udpPort.open();

  }

  public processMsg(msg, time, info) {
    if (msg.address !== '/ping') {
      if (clientLogger) {
        clientLogger.log('OSC >> server ' + JSON.stringify(msg));
      }
    }
    if (msg.address === '/ping') {
      this.udpPort.send({address: '/pong'});
      return;
    } else if (msg.address === '/allColors') {
      dmxController.setAllColor({r: msg.args[0], g: msg.args[1], b: msg.args[2]});
    } else {

      callAnyAccessibleFromRemote(rootState, msg.address, msg.args, info.address + ':' + info.port);
    }

  }

  public processBundle(b, time, info) {
    for (const i of Object.keys(b.packets)) {
      const p = b.packets[i];
      if (p.packets) {this.processBundle(p, time, info); } else {this.processMsg(p, time, info); }
    }
  }

}

export default new OSCServer();
