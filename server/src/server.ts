const debug =  process.env.NODE_ENV !== 'production';
const logClientMessages = process.env.LOG_MSG;
if (!debug) {require('module-alias/register'); } // form module resolution

const clientLogger = logClientMessages ? require('@API/Logger').default : undefined;
const PORT = process.env.PORT || 3000;

import express from 'express';
import http from  'http';
import io from 'socket.io';
import OSCServer from './OSCServer';
OSCServer.connect(11000);
// import {getter, setter} from './types'
import dmxController from './dmxController';

import rootState from '@API/RootState';
import { callAnyAccessibleFromRemote,doSharedFunction,blockSocket,unblockSocket } from '@API/ServerSync';
rootState.registerDMXController(dmxController);
rootState.init()

import log from './remoteLogger';

const { diff } = require('json-diff');
import { nextTick} from '@API/MemoryUtils';

const history = require('connect-history-api-fallback');

const fs = require('fs');
const path = require('path');

const publicDir = debug ? path.resolve(__dirname, '..', 'dist', 'server', 'public') : path.resolve(__dirname, '..', 'public');
console.log('served Folder  :' + publicDir, __dirname);

const app = express();
app.use(history());
const httpServer = new http.Server(app);


const localStateFile = path.resolve(__dirname, '..', 'appSettings.json');

const ioServer = io({
  serveClient: false,
});
import {bindClientSocket} from '@API/ServerSync';
bindClientSocket(ioServer);
ioServer.attach(httpServer, {
  pingInterval: debug ? 60000 : 10000,
  pingTimeout: debug ? 30000 : 5000,
  cookie: false,
});
if (debug) {
  console.log(`run viewer on port ${PORT}`);
}

app.use(express.static(publicDir));

let states: any = {};

// write empty if non existent
fs.writeFile(localStateFile, JSON.stringify({}), { flag: 'wx', encoding: 'utf-8' }, (ferr:any) => {
  if (ferr) {
    console.log('fileExists', localStateFile);
    fs.readFile(localStateFile, 'utf8', (err:any, data:any) => {
      if (err) {
        return console.log(err);
      }
      if (data === '') {data = '{}'; }
      if (data ) {
          setStateFromObject(JSON.parse(data), null);
      }

    });

  } else {
    console.log('created file');
  }

});





function setStateFromObject(msg:any, socket: any) {
  console.log('setting state from: ' + socket);

  const dif = diff(states, msg);

  if (dif !== undefined || !rootState.isConfigured) {
    console.log('diff', dif);
    states = {};
    states = msg;


    if (socket) {
      console.log('broadcasting state: ' + msg);
      socket.broadcast.emit('SET_STATE', msg);
    //  blockSocket(socket)
    }
    // no need to sync as we already brodcasted the state
    doSharedFunction(()=>
    rootState.configureFromObj(msg))

    // if(socket){
    //   nextTick(()=>unblockSocket(socket))
    // }
    states = rootState.toJSONObj(); // update persistent changes
    // dmxController.stateChanged(msg)
    fs.writeFile(localStateFile,
      JSON.stringify(states, null, '  '),
      'utf8',
      (v:any) => {
        if (v) {
          console.log('file write error : ', v);
        }
      },
      );

  } else {
    console.log('no mod from state');
  }
  // debugger


}

if (debug && process.env.LOG_SOCKET_FILE) {
  const logFile =  process.env.LOG_SOCKET_FILE;
  fs.unlinkSync(logFile);
}
ioServer.on('connection', (socket) => {
  console.log('a user connected', socket.id, debug, Object.keys(ioServer.clients().connected));

  log.bindToSocket(socket);
  const emitF = socket.emit;
  socket.emit  = (event: string | symbol, ...args: any[]) => {

    if (clientLogger) {
      // @ts-ignore
      const isBroadCasting = socket.flags.broadcast;
      const evt = JSON.stringify(event)
      if(!evt || !evt.endsWith("/_time")){
        let a = JSON.stringify(args)
        if (evt==="SET_STATE"){a = ""}
            clientLogger.log('server >> ' + (isBroadCasting ? ' to any but ' : '') + socket.id + evt + a + '\n');
          }
    }

    return emitF.apply(socket, [event, ...args]);
  };
  socket.use((packet, next) => {
    if (clientLogger) {
      clientLogger.log(socket.id + ' >> server ' + JSON.stringify(packet) + '\n');
    }
    next();
  });

  socket.use((packet, next) => {
    if (packet && packet[0] && packet[0][0] === '/') {
      const res = callAnyAccessibleFromRemote(rootState, packet[0], packet[1], socket.id);
      if (res !== undefined && !packet[1]) {// catch only getters (not function)
        socket.emit(packet[0], res);
        // return
      }

    }
    return next();
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });

  socket.on('GET_ID', () => {
    socket.emit('SET_ID', socket.id);
  });

  socket.on('SET_STATE', (key, msg) => {
   setStateFromObject(msg, socket);
 });

  socket.on('GET_STATE', (key, cb) => {
    const msg = states;
    if (cb) {
      cb(msg || {});
    } else {
      socket.emit('SET_STATE', msg);
    }
    // console.log('sending state: ' + JSON.stringify(msg.states));

  });

  socket.on('UPDATE_STATE', (key, msg) => {
    if (msg) {
      Object.assign(states, msg);
    }
  });


});
dmxController.register(ioServer, rootState.universe);

httpServer.listen(PORT, () => {
 console.log(`Server is running in http://localhost:${PORT}`);
});
