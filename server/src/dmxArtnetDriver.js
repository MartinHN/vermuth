const artnetM = require("artnet");
const util  = require("util");
const EventEmitter = require("events").EventEmitter;
import { execSync } from "child_process"
const proc =  execSync("uname -a").toString()
export const isPi = proc.includes("armv")


function ArtnetDriver(deviceId = "255.255.255.255", options = {}) {
  
  if ((!deviceId) || deviceId === "none" || deviceId.startsWith("/")) {
    deviceId = "255.255.255.255";
  }
 
  this.bufSize = 512;
  this.universe = Buffer.alloc(this.bufSize + 1);
  this.universe.fill(0);

  const opts = {
    host:deviceId,//   host (Default "255.255.255.255")
    // port (Default 6454)
    // refresh (millisecond interval for sending unchanged data to the Art-Net node. Default 4000)
    iface:isPi?'eth0':'enp7s0'// iface (optional string IP address - bind udp socket to specific network interface)
    // sendAll (sends always the full DMX universe instead of only changed values. Default false)

  }
  console.log("starting with opts",options)
  this.artnet = artnetM(options);
  this.dev = {} // backward compat..

  this.start();
}



ArtnetDriver.prototype.sendUniverse = function() {
  for (const i in this.universe) {
    this.artnet.set(i, this.universe[i])
  }
};

ArtnetDriver.prototype.start = function() {
  // this.timeout = setInterval(this.sendUniverse.bind(this), this.sleepTime);
};

ArtnetDriver.prototype.stop = function() {
  // clearInterval(this.timeout);
  this.artnet.close();
};

ArtnetDriver.prototype.close = function(cb) {
  this.stop();
  cb(null);
};

ArtnetDriver.prototype.update = function(u) {
  for (const c in u) {
    this.universe[c] = u[c];
    this.artnet.send(c, this.universe[c]);
  }
};

ArtnetDriver.prototype.updateAll = function(v) {
  for (let i = 1; i <= this.bufSize ; i++) {
    this.universe[i] = v;
    this.artnet.send(i, this.universe[i]);
  }
};

ArtnetDriver.prototype.get = function(c) {
  return this.universe[c];
};

util.inherits(ArtnetDriver, EventEmitter);

module.exports = ArtnetDriver;
