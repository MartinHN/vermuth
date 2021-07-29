const osc = require("osc");
const util  = require("util");
const EventEmitter = require("events").EventEmitter;
const _ = require("lodash");

function LoggerDriver(deviceId = "127.0.0.1", options = {}) {

  this.bufSize = 512;
  this.universe = Buffer.alloc(this.bufSize + 1);
  this.universe.fill(0);

  /**
   * Allow artnet rate to be set and default to 44Hz
   * @type Number
   */

  this.start();
}

let changeQ = {};
const logDebounced =  _.debounce(() => {
  for (const c in changeQ) {
    const v = changeQ[c];
    console.log("set dimmer (", c, ") to ", v);
  }
  changeQ = {};
}, 50, {maxWait: 100});
LoggerDriver.prototype.log = function(c, v) {
  changeQ[c] = v;
  logDebounced();

};

LoggerDriver.prototype.sendUniverse = function() {
  for (const i in this.universe) {
    const m = this.log(i, this.universe[i]);
    this.dev.send(m);
  }
};

LoggerDriver.prototype.start = function() {
  // this.timeout = setInterval(this.sendUniverse.bind(this), this.sleepTime);
};

LoggerDriver.prototype.stop = function() {
  // clearInterval(this.timeout);
};

LoggerDriver.prototype.close = function(cb) {
  if (this.dev ) { this.dev.close(); }
  this.stop();
  cb(null);
};

LoggerDriver.prototype.update = function(u) {
  for (const c in u) {
    if ( this.universe[c] !== u[c]) {
      this.log(c, u[c]);
    }
    this.universe[c] = u[c];

  }
};

LoggerDriver.prototype.updateAll = function(v) {
  for (let i = 1; i <= this.bufSize ; i++) {
    if (v !== this.universe[i]) {
      this.log(i, v);
    }
    this.universe[i] = v;
  }

};

LoggerDriver.prototype.get = function(c) {
  return this.universe[c];
};

util.inherits(LoggerDriver, EventEmitter);

module.exports = LoggerDriver;
