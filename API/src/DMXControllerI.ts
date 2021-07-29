
export interface DMXControllerI {


  selectedPortName: string;
  __portNameList: string[];
  selectedDriverName: string;
  __driverNameList: string[];
  __connected: boolean;

  setCircs(msg: Array<{c: number, v: number}>, fromSocket: any): void;

  connectToDevice(cb: (msg: string) => void, options: any): void;
  configureFromObj(o: any): void;

}

export function needSerialPort(n: string) {
  return ('' + n).startsWith('enttec');
}

// export function needUdpPort(n: string) {
//   n = '' + n;
//   return ['QLC', 'artnet','SACN', /.*OSC*./].some((e) => n.match(e));
// }
