const debug =  process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;
if(!debug)require('module-alias/register'); // form module resolution
import * as express from "express";
import * as http from  'http';
import * as io from 'socket.io'
import OSCServer from './OSCServer'
OSCServer.connect(4444);
//import {getter, setter} from './types'
import dmxController from './dmxController'

import rootState from '@API/RootState'
rootState.registerDMXController(dmxController)


import log from './remoteLogger'
import { diff } from 'json-diff';

var history = require("connect-history-api-fallback");

const fs = require('fs');
const path = require('path')

const publicDir = path.resolve(__dirname,'..','public')
console.log('served Folder  :' + publicDir)

const app = express();
app.use(history());
const httpServer = new http.Server(app);


const localStateFile = path.resolve(__dirname,'..','appSettings.json')

const ioServer = io({
  serveClient: false
});
import {bindClientSocket} from "@API/ServerSync"
bindClientSocket(ioServer)
ioServer.attach(httpServer,{
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
})
if(debug){
  console.log(`run viewer on port ${PORT}`)
}

app.use(express.static(publicDir));

let states = {}

// write empty if non existent
fs.writeFile(localStateFile, JSON.stringify({}), { flag: "wx",encoding:'utf-8' }, function(err) {
  if (err) {
    console.log("fileExists");
    fs.readFile(localStateFile, 'utf8', (err, data) => {
      if (err) {
        return console.log(err);
      }
      if(data===""){data = "{}"}
      Object.assign(states ,  JSON.parse(data))
      if(states && states["lastSessionID"]){
        const lastState = states[states["lastSessionID"]]
        if(lastState){
          setStateFromObject(lastState,null)
        }
      }
      
    });
    
  }
  else{
    console.log("created file");
  }

});





function getSessionId(socket){
  return 'default'
  // return socket.id
}

function setStateFromObject(msg,socket:any){
  // console.log('setting state: ' + JSON.stringify(msg));
  const sessionID = getSessionId(socket)
  const dif = diff(states[sessionID],msg)
  
  if(dif!==undefined || !rootState.isConfigured){
  console.log('diff',dif);
  states = {}
  states[sessionID] = msg;
  states["lastSessionID"] = sessionID;
  rootState.configureFromObj(msg) 
  debugger
  states[sessionID] = rootState.toJSONObj() // update persistent changes
  // dmxController.stateChanged(msg)
  fs.writeFile(localStateFile, JSON.stringify(states,null,'  '),'utf8', (v)=>{if(v){console.log('file write error : ',v);}})
  
  }
  else{
    console.log('no mod from state')
  }
  if(socket){
    // console.log('broadcasting state: ' + JSON.stringify(msg.states));
    socket.broadcast.emit('SET_STATE',msg)
   
  }

}


ioServer.on('connection', function(socket){
  console.log('a user connected',socket.id);
  log.bindToSocket(socket)
  socket.use((packet, next) => {
    if(packet && packet[0] && packet[0][0]==="/"){
      const res = rootState.callMethod(packet[0],packet[1])
      if(res!==undefined){
        socket.emit(packet[0],res)
        return
      }
      
    }
    return next();
  });
  socket.on('disconnect', ()=>{
    console.log('user disconnected',socket.id);
  });

  socket.on('GET_ID', () => {
    socket.emit('SET_ID',socket.id)
  });
  
  socket.on('SET_STATE', (key,msg) => {
   setStateFromObject(msg,socket)
 });

  socket.on('GET_STATE', (key,cb) => {
    const msg = states[getSessionId(socket)]
    cb(msg || {});
    // console.log('sending state: ' + JSON.stringify(msg.states));

  });

  socket.on('UPDATE_STATE',(key,msg)=>{
    if(msg){
      Object.assign(states[getSessionId(socket)],msg)
    }
  })

  
});
dmxController.register(ioServer,rootState.universe)

httpServer.listen(PORT, () => {
 console.log(`Server is running in http://localhost:${PORT}`)
})
