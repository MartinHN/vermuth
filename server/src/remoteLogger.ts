
import * as io from 'socket.io'



const debug =  process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

class Logger{
  sock?:io.Socket;

  constructor(){

  }
  bindToSocket(s:io.Socket){
    this.sock = s;
  }
  log(msg:any){
    this.broadcastSock("log",msg)
    console.log(msg)
  }
  warn(msg:any){
    this.broadcastSock("warn",msg)
    console.warn(msg)
  }
  error(msg:any){
    this.broadcastSock("err",msg)
    console.error(msg)
  }

  broadcastSock(type:string,msg:any){
    if(this.sock){this.sock.broadcast.emit("DBG",{type,msg})}
    else{console.error("socket not bound")}
  }
  
}

export default new Logger()