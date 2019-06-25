import * as express from "express";
import * as http from  'http';
import * as io from 'socket.io'
import OSCServer from './OSCServer'
OSCServer.connect(4444);
//import {getter, setter} from './types'
import dmxController from './dmxController'
import log from './remoteLogger'

var history = require("connect-history-api-fallback");
// import {diff} from 'json-diff'
const fs = require('fs');
const path = require('path')

const publicDir = path.resolve(__dirname,'..','public')
console.log('served Folder  :' + publicDir)
const debug =  process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(history());
const httpServer = new http.Server(app);


const localStateFile = path.resolve(__dirname,'..','appSettings.json')

const ioServer = io({
  serveClient: false
});

ioServer.attach(httpServer,{
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
})
if(debug){
  console.log(`run viewer on port ${PORT}`)
}

app.use(express.static(publicDir));

const states = {}

// write empty if non existent
fs.writeFile(localStateFile, JSON.stringify({}), { flag: "wx",encoding:'utf-8' }, function(err) {
  if (err) {
    console.log("fileExists");
    fs.readFile(localStateFile, 'utf8', (err, data) => {
      if (err) {
        return console.log(err);
      }
      Object.assign(states ,  JSON.parse(data))
    });
    setStateFromObject(states,null)
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
  console.log('setting state: ' + msg);
  const sessionID = getSessionId(socket)
  states[sessionID] = msg;
  states["lastSessionID"] = sessionID; 
  fs.writeFile(localStateFile, JSON.stringify(states),'utf8', (v)=>{if(v){console.log('file write error : ',v);}})
  dmxController.stateChanged(msg)
  console.log('broadcasting state: ' + msg);
  if(socket)socket.broadcast.emit('SET_STATE',msg)

}

ioServer.on('connection', function(socket){
  console.log('a user connected',socket.id);
  log.bindToSocket(socket)
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
    cb(msg);
    console.log('sending state: ' + msg);

  });

  socket.on('UPDATE_STATE',(key,msg)=>{
    if(msg){
      Object.assign(states[getSessionId(socket)],msg)
    }
  })

  dmxController.register(socket)
});


httpServer.listen(PORT, () => {
 console.log(`Server is running in http://localhost:${PORT}`)
})
