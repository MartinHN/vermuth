
import * as io from 'socket.io';



const debug =  process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

class Logger {
  public sock?: io.Socket;

  constructor() {

  }
  public bindToSocket(s: io.Socket) {
    this.sock = s;
  }
  public log(msg: any) {
    this.broadcastSock('log', msg);
    console.log(msg);
  }
  public warn(msg: any) {
    this.broadcastSock('warn', msg);
    console.warn(msg);
  }
  public error(msg: any) {
    this.broadcastSock('err', msg);
    console.error(msg);
  }

  public broadcastSock(type: string, msg: any) {
    if (this.sock) {this.sock.broadcast.emit('DBG', {type, msg}); } else {console.error('socket not bound'); }
  }

}

export default new Logger();
