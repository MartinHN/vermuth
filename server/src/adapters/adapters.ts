import Wii from '@/controllers/wii';
import {EventEmitter} from 'events';
import {type} from 'os';
const osc = require('osc');


class OSCSender {
  public udpPort = new osc.UDPPort({
    localAddress: '0.0.0.0',  // broadcast//0.0.0.0",
    localPort: undefined,
    remoteAddress: '127.0.0.1',
    remotePort: 11000
  });

  constructor() {
    this.udpPort.open();
  }

  public send(address: string, args: any) {
    this.udpPort.send({address, args})
  }
}

const sender = new OSCSender();
interface OSCMSG {
  address: string;
  args?: any;
}

class Adapter {
  mappingDic: {[id: string]: string} = {};
  constructor(public controller: EventEmitter, public interpreter: {
    toOSC: (string, any) => OSCMSG[] | OSCMSG | undefined;
  }) {
    this.controller.on('event', (name, value) => {
      console.log('sending Cmds for', name, value)
      const cmds = this.interpreter.toOSC(name, value);
      if (cmds) {
        this.sendCmds(cmds)
      }
    })
  }


  sendCmds(msgs: OSCMSG[]|OSCMSG) {
    if (!Array.isArray(msgs)) {
      msgs = [msgs]
    }
    for (const m of msgs) {
      sender.send(m.address, m.args);
    }
  }
}


class WiiInterpreter {
  toOSC(name: string, value: boolean) {
    if (name == 'B') {
      return {
        address: '/fog', args: value ? 1 : 0
      }
    }
    if (!value) {
      return;
    }
    if (name == '+') {
      return {
        address: '/sequencePlayer/next'
      }
    }
    if (name == '-') {
      return {
        address: '/sequencePlayer/prev'
      }
    }
    if (name == 'up') {
      return {
        address: '/sequencePlayer/goToStateNamed', args: ['public', 5, 1]
      }
    }
    if (name == 'down') {
      return {
        address: '/sequencePlayer/goToStateNamed', args: ['public', 5, 0]
      }
    }

    return
  }
}

export class WiiAdapter extends Adapter {
  constructor() {
    super(new Wii(), new WiiInterpreter())
  }
}
// export const wiiAdapt = new Adapter(wii, interp)
