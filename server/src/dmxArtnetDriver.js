const artnetM = require("artnet");
const util  = require("util");
const EventEmitter = require("events").EventEmitter;
const execSync = require("child_process").execSync;
const proc =  execSync("uname -a").toString()
const isPi = proc.includes("armv")

function RpiArtnetDriver(deviceId = "255.255.255.255", options = {}) {
  if ((!deviceId) || deviceId === "none" || deviceId.startsWith("/")) {
    deviceId = "2.255.255.255"//"2.255.255.255"//"2.0.36.0" // for ltech node dmxArtnet last is universe num// "2.255.255.255";
  }
  console.log(">>>>>>RpiArtnet",deviceId);

  
  this.bufSize = 512;
  this.universe = Buffer.alloc(this.bufSize + 1);
  this.universe.fill(0);

  const opts = {
    host:deviceId,//   host (Default "2.255.255.255")
    // port (Default 6454)
    // refresh (millisecond interval for sending unchanged data to the Art-Net node. Default 4000)
    iface:isPi?'2.2.2.100':'2.0.3.3', //'enp7s0'// iface (optional string IP address - bind udp socket to specific network interface)
    // sendAll (sends always the full DMX universe instead of only changed values. Default false)
     sendAll:true

  }
  console.log("starting with opts",opts)
  this.artnet = artnetM(opts);
  this.dev = {} // backward compat..

  this.start();
}



RpiArtnetDriver.prototype.sendUniverse = function() {
  for (const i in this.universe) {
    this.artnet.set(i, this.universe[i])
  }
};

RpiArtnetDriver.prototype.start = function() {
  // this.timeout = setInterval(this.sendUniverse.bind(this), this.sleepTime);
};

RpiArtnetDriver.prototype.stop = function() {
  // clearInterval(this.timeout);
  this.artnet.close();
};

RpiArtnetDriver.prototype.close = function(cb) {
  this.stop();
  cb(null);
};

RpiArtnetDriver.prototype.update = function(u) {
  for (const c in u) {
    this.universe[c] = u[c];
    this.artnet.set(c, this.universe[c]);
  }
};

RpiArtnetDriver.prototype.updateAll = function(v) {
  for (let i = 1; i <= this.bufSize ; i++) {
    this.universe[i] = v;
    this.artnet.set(i, this.universe[i]);
  }
};

RpiArtnetDriver.prototype.get = function(c) {
  return this.universe[c];
};

util.inherits(RpiArtnetDriver, EventEmitter);

module.exports = RpiArtnetDriver;
