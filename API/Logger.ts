const isClient = process.env.VUE_APP_ISCLIENT;


class MyLogger {
  public dbgStream?: any;

  constructor() {
    const fs = require('fs');
    if (process.env.LOG_SOCKET_FILE) {
      console.log('creating logger at', process.env.LOG_SOCKET_FILE);
      this.dbgStream = fs.createWriteStream(process.env.LOG_SOCKET_FILE, { flag: 'aw', encoding: 'utf-8' });
    }
  }


  public log(txt) {
    console.log( txt);
    if (this.dbgStream) {
      
      this.dbgStream.write(txt);
    }
  }



}

const logger = new MyLogger();
export default logger;
