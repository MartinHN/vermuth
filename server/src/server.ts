import * as express from "express";
import * as http from  'http';
import * as io from 'socket.io'
import {getter, setter} from './types'
import dmxController from './dmxController'
var history = require("connect-history-api-fallback");
// import {diff} from 'json-diff'
const fs = require('fs');

const debug =  process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(history());
const httpServer = new http.Server(app);

const localStateFile = '/tmp/conduktor.json'

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
// else{
  app.use(express.static('public'));
// }
const states = {}

// write empty if non existent
fs.writeFile(localStateFile, JSON.stringify({}), { flag: "wx",encoding:'utf-8' }, function(err) {
  if (err) {
    console.log("fileExists");
  }
  else{
    console.log("created file");
  }
  fs.readFile(localStateFile, 'utf8', (err, data) => {
    if (err) {
      return console.log(err);
    }
    Object.assign(states, data)
  });
});





function getSessionId(socket){
  return 'default'
  // return socket.id
}
ioServer.on('connection', function(socket){
  console.log('a user connected',socket.id);

  socket.on('disconnect', ()=>{
    console.log('user disconnected',socket.id);
  });

  socket.on('GET_ID', () => {
    socket.emit('SET_ID',socket.id)
  });
  
  socket.on('SET_STATE', (key,msg) => {
    console.log('setting state: ' + msg);
    states[getSessionId(socket)] = msg;
    fs.writeFile(localStateFile, JSON.stringify(states),'utf8', (v)=>{if(v){console.log('file write error : ',v);}})
    console.log('broadcasting state: ' + msg);
    socket.broadcast.emit('SET_STATE',msg)
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
