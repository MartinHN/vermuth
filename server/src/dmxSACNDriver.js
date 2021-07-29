const { Sender } = require('sacn');




//   await sACNServer.send({
//     payload: { // required. object with the percentages for each DMX channel
//       1: 100,
//       2: 50,
//       3: 0,
//     },
//     sourceName: "My NodeJS app", // optional. LED lights will use this as the name of the source lighting console.
//     priority: 100, // optional. value between 0-200, in case there are other consoles broadcasting to the same universe
//   });

//   sACNServer.close(); // terminate the server when your app is about to exit.
// }


const osc = require("osc");
const util  = require("util");
const EventEmitter = require("events").EventEmitter;
const _ = require("lodash");

function SACNDriver(deviceId = "127.0.0.1", options = {}) {
    
    this.bufSize = 512;
    this.universe = Buffer.alloc(this.bufSize + 1);
    this.universe.fill(0);
    
    /**
    * Allow artnet rate to be set and default to 44Hz
    * @type Number
    */
    this.dev = new Sender({
        universe: options.universe || 1,
        // see table 3 below for all options
        //         universe	number	Required. The universes to listen to. Must be within 1-63999	[]
        // port	number	Optional. The multicast port to use. All professional consoles broadcast to the default port.	5568
        // reuseAddr	boolean	Optional. Allow multiple programs on your computer to listen to the same sACN universe.
    });
    this.start();
}


SACNDriver.prototype.sendFrame = function(payload) {
    this.dev.send({payload,
        // sourceName: "My NodeJS app", // optional. LED lights will use this as the name of the source lighting console.
        //     priority: 100, // optional. value between 0-200, in case there are other consoles broadcasting to the same universe
        //  
    });
    
}

SACNDriver.prototype.sendUniverse = function() {
    const m = {}
    for (const i in this.universe) {
        m[i+1] =  this.universe[i];
    }
    this.sendFrame(m);  
};

SACNDriver.prototype.start = function() {
    // this.timeout = setInterval(this.sendUniverse.bind(this), this.sleepTime);
};

SACNDriver.prototype.stop = function() {
    // clearInterval(this.timeout);
};

SACNDriver.prototype.close = function(cb) {
    if (this.dev ) { this.dev.close(); }
    this.stop();
    cb(null);
};

SACNDriver.prototype.update = function(u) {
    const m = {}
    for (const c in u) {
        if ( this.universe[c] !== u[c]) {
            m[c] = u[c];
        }
        this.universe[c] = u[c];
        
    }
    if(Object.keys(m).length>0){
        this.sendFrame(m);
    }
};

SACNDriver.prototype.updateAll = function(v) {
    const m = {}
    for (let i = 1; i <= this.bufSize ; i++) {
        if (v !== this.universe[i]) {
            m[i] =  v;
        }
        this.universe[i] = v;
    }
    if(Object.keys(m).length>0){
        this.sendFrame(m);
    }
};

SACNDriver.prototype.get = function(c) {
    return this.universe[c];
};

util.inherits(SACNDriver, EventEmitter);

module.exports = SACNDriver;
