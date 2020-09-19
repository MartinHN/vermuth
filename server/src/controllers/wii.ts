import {ControllerI} from '@API/Controllers/ControllerI'
import {AccessibleClass, nonEnumerable, RemoteValue} from '@API/ServerSync';

import {EventEmitter} from 'events';

const HID = require('node-hid');
HID.setDriverType('hidraw');  // "libusb"


@AccessibleClass()
export default class Wii extends EventEmitter implements ControllerI {
  static BTNS_PREAMBLE = 0x30;
  static BTNS_byte1 = ['left', 'right', 'down', 'up', '+'];
  static BTNS_byte2 = ['2', '1', 'B', 'A', '-', 'null', 'null', 'home'];

  buttonState: any = {};
  @RemoteValue() isConnected = false;

  timer: any = undefined;
  device: any = undefined
  constructor() {
    super();
    console.log('wii');
    this.connect();
  }

  connect() {
    this.disconnect();
    const devices = HID.devices();
    console.log('devices', devices)
    const deviceDesc = devices.find(e => e.product?.startsWith('Nintendo'));
    if (deviceDesc) {
      this.stopConnectionTimer();
      this.device = new HID.HID(deviceDesc.path);
      this.device.on('data', this.dataRcv.bind(this));
      this.device.on('error', this.errRcv.bind(this));
      this.isConnected = true;
    } else {
      this.startConnectionTimer();
    }
    console.log('device', this.device);
  }

  disconnect() {
    this.isConnected = false;
    this.buttonState = {};
    for (const b of Wii.BTNS_byte1) {
      this.buttonState[b] = false;
    }
    for (const b of Wii.BTNS_byte2) {
      this.buttonState[b] = false;
    }
    this.stopConnectionTimer();
    if (this.device) {
      console.log('closing');
      this.device.close();
    }
    this.device = undefined;
  }
  startConnectionTimer() {
    this.stopConnectionTimer();
    this.timer = setInterval(this.connect.bind(this), 1000);
  }
  stopConnectionTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  dataRcv(data: any) {
    this.stopConnectionTimer();
    // console.log('dataRcv', data, data.length);
    const inBuf = data as Buffer;
    if (inBuf.length == 3 && inBuf[0] == Wii.BTNS_PREAMBLE) {
      Wii.BTNS_byte1.forEach((v, i) => {
        if (this.buttonState[v] !== undefined) {
          const b = !!(inBuf[1] & (1 << i));
          if (this.buttonState[v] != b) {
            this.buttonState[v] = b;
            this.btnChanged(v, b);
          }
        }
      });
      Wii.BTNS_byte2.forEach((v, i) => {
        if (this.buttonState[v] !== undefined) {
          const b = !!(inBuf[2] & (1 << i));
          if (this.buttonState[v] != b) {
            this.buttonState[v] = b;
            this.btnChanged(v, b);
          }
        }
      });
    }
  }

  errRcv(e: any) {
    console.log('err : ', e);
    this.disconnect();
    this.startConnectionTimer();
  }

  btnChanged(n: string, v: boolean) {
    console.log('Btn');
    this.emit('event', n, v);
  }
}


// export const wii = new Wii()
