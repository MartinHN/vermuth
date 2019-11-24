const debug =  process.env.NODE_ENV !== 'production';
const executingFromDist = __dirname.includes("/dist/")
if(executingFromDist)require('module-alias/register');  // form module resolution
const logClientMessages = process.env.LOG_MSG;

const args = require('minimist')(process.argv.slice(2));
const clientLogger = logClientMessages ? require('@API/Logger').default : undefined;
const PORT = process.env.PORT || 3000;

import * as os from 'os'
import * as express from 'express';
import * as http from  'http';
import * as io from 'socket.io';
import OSCServer from './OSCServer';
OSCServer.connect(11000);
// import {getter, setter} from './types'
import dmxController from './dmxController';

import rootState from '@API/RootState';
import { callAnyAccessibleFromRemote } from '@API/ServerSync';
import { buildEscapedObject } from '@API/SerializeUtils';
rootState.registerDMXController(dmxController);


import log from './remoteLogger';
import { diff } from 'json-diff';


const fs = require('fs');
const path = require('path');
function pathExists(path){try {if (fs.existsSync(path)) {return true;}} catch(err) {}return false}

function getFileAtPath(filePath){ //file name is insensitive
  var dirname = path.dirname(filePath);
  var lowerFileName = path.basename(filePath).toLowerCase();
  try {
    var fileNames = fs.readdirSync(dirname);
    for (let i= 0; i < fileNames.length; i += 1) {
      if (fileNames[i].toLowerCase() === lowerFileName) {
        return path.join(dirname, fileNames[i]);
      }
    }
  } catch(err) {}
  return false
}

const publicDir = args.public || (executingFromDist?path.resolve(__dirname, '..', 'public'):path.resolve(__dirname, '..', 'dist', 'server', 'public') );//: ;
console.log('served Folder  :' + publicDir, __dirname);

const history = require('connect-history-api-fallback');
const app = express();
app.use(history());
const httpServer = new http.Server(app);


let localStateFile = path.resolve(__dirname, '..', 'appSettings.json');


///////
// resolve session from args
if(args.path){
  if(! Array.isArray(args.path)){args.path = [args.path]}
  let found = false
  let sessionName  = args.session || os.hostname().split(".local")[0]
  let candidateFolders = []
  let candidateFileNames = [sessionName+'.json']
  for(const folderPath of args.path){
    const candidateFolder = path.resolve(folderPath)
    if(pathExists(candidateFolder)){candidateFolders.push(folderPath)}
    else {console.error("not found external settings folder",folderPath)}
  }
  for(const f of candidateFolders){
    for(const c of candidateFileNames){
      const testedPath = path.resolve(f,c)
      const truePath = getFileAtPath(testedPath)
      if(truePath){
        localStateFile = truePath
        found =  true
        break;
      }
    }
    if(found){break}
  }

  if(!found){console.error(`not found session , ${candidateFileNames} in ${candidateFolders}`);}
}

const ioServer = io({serveClient: false,});

import {bindClientSocket} from '@API/ServerSync';
bindClientSocket(ioServer);
ioServer.attach(httpServer, {
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

if (debug) {console.log(`run viewer on port ${PORT}`);}

app.use(express.static(publicDir));

let states: any = {};

// write empty if non existent
fs.writeFile(localStateFile, JSON.stringify({}), { flag: 'wx', encoding: 'utf-8' }, function(ferr) {
  if (ferr) {
    console.log('fileExists');
    fs.readFile(localStateFile, 'utf8', (err, data) => {
      if (err) {return console.log(err);}
      if (data === '') {data = '{}'; }
      let lastState = {}
      Object.assign(lastState ,  JSON.parse(data));
      if (lastState) {setStateFromObject(lastState, null);}
      else{console.error ('not found state from file')}
    });
  } else {
    console.log('created file');
  }
});





function setStateFromObject(msg, socket: any) {
  console.log('setting state from: ' + socket);
  
  const dif = diff(states, msg);

  if (dif !== undefined || !rootState.isConfigured) {
    console.log('diff', dif);
    states = msg;
    

    if (socket) {
      console.log('broadcasting state: ' + JSON.stringify(msg.states));
      socket.broadcast.emit('SET_STATE', msg);

    }
    rootState.configureFromObj(msg);
    states = rootState.toJSONObj(); // update persistent changes
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
ioServer.on('connection', function(socket) {
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
    const msg = buildEscapedObject(rootState)
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
