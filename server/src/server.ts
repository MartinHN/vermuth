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
import { callAnyAccessibleFromRemote } from '@API/ServerSync';
rootState.registerDMXController(dmxController);


import log from './remoteLogger';
import { diff } from 'json-diff';

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
fs.writeFile(localStateFile, JSON.stringify({}), { flag: 'wx', encoding: 'utf-8' }, (ferr)=> {
  if (ferr) {
    console.log('fileExists');
    fs.readFile(localStateFile, 'utf8', (err, data) => {
      if (err) {
        return console.log(err);
      }
      if (data === '') {data = '{}'; }
      Object.assign(states ,  JSON.parse(data));
      if (states && states.lastSessionID) {
        const lastState = states[states.lastSessionID];
        if (lastState) {
          setStateFromObject(lastState, null);
        }
      }

    });

  } else {
    console.log('created file');
  }

});





function getSessionId(socket) {
  return 'default';
  // return socket.id
}

function setStateFromObject(msg, socket: any) {
  console.log('setting state from: ' + socket);
  const sessionID = getSessionId(socket);
  const dif = diff(states[sessionID], msg);

  if (dif !== undefined || !rootState.isConfigured) {
    console.log('diff', dif);
    states = {};
    states[sessionID] = msg;
    states.lastSessionID = sessionID;

    if (socket) {
      console.log('broadcasting state: ' + JSON.stringify(msg.states));
      socket.broadcast.emit('SET_STATE', msg);

    }
    rootState.configureFromObj(msg);
    states[sessionID] = rootState.toJSONObj(); // update persistent changes
    // dmxController.stateChanged(msg)
    fs.writeFile(localStateFile,
      JSON.stringify(states, null, '  '),
      'utf8',
      (v) => {
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
ioServer.on('connection', (socket)=> {
  console.log('a user connected', socket.id, debug);

  log.bindToSocket(socket);
  const emitF = socket.emit;
  socket.emit  = (event: string | symbol, ...args: any[]) => {

    if (clientLogger) {
      // @ts-ignore
      const isBroadCasting = socket.flags.broadcast;
      clientLogger.log('server >> ' + (isBroadCasting ? ' to any but ' : '') + socket.id + JSON.stringify(event) + JSON.stringify(args) + '\n');
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
    const msg = states[getSessionId(socket)];
    if (cb) {
      cb(msg || {});
    } else {
      socket.emit('SET_STATE', msg);
    }
    // console.log('sending state: ' + JSON.stringify(msg.states));

  });

  socket.on('UPDATE_STATE', (key, msg) => {
    if (msg) {
      Object.assign(states[getSessionId(socket)], msg);
    }
  });


});
dmxController.register(ioServer, rootState.universe);

httpServer.listen(PORT, () => {
 console.log(`Server is running in http://localhost:${PORT}`);
});
