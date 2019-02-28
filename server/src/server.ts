import * as express from "express";
import * as http from  'http';
import * as io from 'socket.io'
import {getter, setter} from './types'
import dmxController from './dmxController'

const debug =  process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = new http.Server(app);



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
else{
  app.use(express.static('public'));
}
const states = {}

ioServer.on('connection', function(socket){
  console.log('a user connected',socket.id);

  socket.on('disconnect', ()=>{
    console.log('user disconnected',socket.id);
  });

  socket.on('GET_ID', (msg) => {
    socket.emit('SET_ID',socket.id)
    console.log('message: ' + msg);
  });
  
  socket.on('SET_STATE', (msg) => {
    states[socket.id] = msg;
    console.log('setting state: ' + msg);
  });
  dmxController.register(socket)
});


httpServer.listen(PORT, () => {
     console.log(`Server is running in http://localhost:${PORT}`)
})
