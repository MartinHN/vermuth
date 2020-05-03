const debugMode =  process.env.NODE_ENV !== 'production';

if (!debugMode) {require('module-alias/register'); } // form module resolution


import debugM from  '@API/dbg';
const debugFile = debugM('FILE')
const debugMsg = debugM('MSG')
const debugState = debugM('STATE')

const PORT = process.env.PORT?parseInt(process.env.PORT) : 3000;


import express from 'express';
import http from  'http';
import io from 'socket.io';
import OSCServer from './OSCServer';
OSCServer.connect(11000);
// import {getter, setter} from './types'
import dmxController from './dmxController';

import rootState from '@API/RootState';
import { callAnyAccessibleFromRemote, doSharedFunction, blockSocket, unblockSocket } from '@API/ServerSync';
rootState.registerDMXController(dmxController);
rootState.init();

import log from './remoteLogger';

const { diff } = require('json-diff');
import { nextTick} from '@API/MemoryUtils';

const history = require('connect-history-api-fallback');

const fs = require('fs');
const path = require('path');
const os = require('os');
const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vermuth-'));
debugFile('backup dir is at ', backupDir);

const publicDir = process.env.PUBLIC_FOLDER || path.resolve(__dirname, '../dist/server/public');
// const publicDir = debugMode ? path.join(__dirname, '../dist/server/public') : path.join(__dirname, '../public');
debugFile('served Folder  :' + publicDir, __dirname);
debugFile('served files',fs.readdirSync(publicDir))
debugFile(fs.readdirSync(__dirname))
if (!fs.existsSync(publicDir+"/index.html")) {
  console.error("can't find public directory to serve", publicDir)
  debugFile(fs.readdirSync(__dirname))

}
const app = express();
const serveIndex = require('serve-index');
app.use('/backups', express.static(backupDir), serveIndex(backupDir));
app.use(history());
const httpServer = new http.Server(app);


const localStateFile = path.join(process.cwd(), 'appSettings.json');

const ioServer = io({
  serveClient: false,
  transports: ['websocket']
});
import {bindClientSocket} from '@API/ServerSync';
bindClientSocket(ioServer);
ioServer.attach(httpServer, {
  pingInterval: debugMode ? 60000 : 10000,
  pingTimeout: debugMode ? 30000 : 5000,
  cookie: false,
});
if (debugMode) {
  console.log(`run viewer on port ${PORT}`);
}

const expressStaticGzip = require('express-static-gzip');
app.use(expressStaticGzip(publicDir));
app.use(express.static(publicDir));

let states: any = {};

// write empty if non existent
fs.writeFile(localStateFile, JSON.stringify({}), { flag: 'wx', encoding: 'utf-8' }, (ferr: any) => {
  if (ferr) {
    debugFile('fileExists', localStateFile);
    fs.readFile(localStateFile, 'utf8', (err: any, data: any) => {
      if (err) {
        return console.error(err);
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


function backupFiles() {
  const bDir = backupDir;
  if (!fs.existsSync(bDir)) {
    fs.mkdirSync(bDir);
  }
  const dName = ('' + new Date()).replace(/:/g,'_',);
  fs.copyFileSync(localStateFile, path.join(bDir, dName));
  fs.readdir(bDir, (err, files) => {

    if (!files) {return; }
    // const shortBkTime = 5* 60 * 1000 ;// 60 * 60  * 1000
    // const longBkTime = 60 * 60 * 1000;
    const shortBkTime = 5 * 1000 ; // 60 * 60  * 1000
    const longBkTime = 20 * 1000;
    const now = Date.now();
    const filesWithDate = files.map((e) => ({path: path.join(bDir, e), date: new Date(e.replace(/_/g,':'))})).sort((a, b) => b.date - a.date);
    debugFile('backups : ', filesWithDate);
    let lastHourBackup: any;
    const filesToRm = new Array<string>();
    for (const e of filesWithDate) {
      const l =  e.date.getTime();
      const diff = (now - l);
      if ( diff < shortBkTime) {
        continue;
      } else if (!lastHourBackup) {
        lastHourBackup = e;
      } else if (lastHourBackup.date.getTime() - e.date.getTime() > longBkTime) {
        lastHourBackup = e;
      } else {
        filesToRm.push(e.path);
      }
    }

    debugFile('backups to rm: ', filesToRm);
    filesToRm.map((f) => fs.unlink(f, (err) => {
      if (err) { throw err; }
      debugFile(f, ' was deleted');
    }));
  });

}


function setStateFromObject(msg: any, socket: any) {
  debugState('setting state from: ' + socket);
  const curState =  rootState.toJSONObj()
  const dif = diff(curState, msg);

  if (dif !== undefined || !rootState.isConfigured) {
    debugState('diff', dif);
    states = {};
    states = msg;


    if (socket) {
      debugState('broadcasting state: ' + msg);
      socket.broadcast.emit('SET_STATE', msg);
      //  blockSocket(socket)
    }
    // no need to sync as we already brodcasted the state
    doSharedFunction(() => {
        rootState.configureFromObj(msg);
      });
    debugState('end configure');
    // if(socket){
      //   nextTick(()=>unblockSocket(socket))
      // }
    states = rootState.toJSONObj(); // update persistent changes

    backupFiles();

    fs.writeFile(localStateFile,
        JSON.stringify(states, null, '  '),
        'utf8',
        (v: any) => {
          if (v) {
            console.error('file write error : ', v);
          }
        },
        );

    } else {
      console.warn('no mod from state');
    }
    // debugModeger


  }

if (debugMode && process.env.LOG_SOCKET_FILE) {
    const logFile =  process.env.LOG_SOCKET_FILE;
    fs.unlinkSync(logFile);
  }
ioServer.on('connection', (socket) => {
    console.log('a user connected', socket.id, debugMode, Object.keys(ioServer.clients().connected));

    log.bindToSocket(socket);
    const emitF = socket.emit;
    socket.emit  = (event: string | symbol, ...args: any[]) => {

      // if (require('debug').enabled('MSG')) {
        // @ts-ignore
        const isBroadCasting = socket.flags.broadcast;
        const evt = typeof(event) === 'string' ? event : JSON.stringify(event);
        if (!evt || !evt.endsWith('/_time')) {
          let a = JSON.stringify(args);
          if (evt === 'SET_STATE') {a = ''; }
          debugMsg('server >> ' + (isBroadCasting ? ' to any but ' : '') + socket.id +" "+ evt + a + '\n');
        }
      // }

      return emitF.apply(socket, [event, ...args]);
    };
    socket.use((packet, next) => {
      // if (clientLogger) {
        debugMsg(socket.id + ' >> server ' + JSON.stringify(packet) + '\n');
      // }
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
      const msg = rootState.toJSONObj();
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
