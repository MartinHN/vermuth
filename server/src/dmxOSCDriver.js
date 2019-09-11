const osc = require("osc");
const util  = require("util");
const EventEmitter = require("events").EventEmitter;

function OSCDriver(deviceId = "127.0.0.1", options = {}) {
  const self = this;
  if((!deviceId) || deviceId==="none"){
    deviceId = "127.0.0.1"
  }
  this.dev = new osc.UDPPort({
    // This is the port we're listening on.
    localAddress: "127.0.0.1",
    localPort: 9009,
    metadata: true,

    remoteAddress: deviceId,
    remotePort: options.port || 7700,

});
  this.bufSize = 512;
  self.universe = Buffer.alloc(this.bufSize + 1);
  self.universe.fill(0);

  /**
   * Allow artnet rate to be set and default to 44Hz
   * @type Number
   */

  this.dev.open();
  self.start();
}

OSCDriver.prototype.createMsg = function(c, v) {
  const address = `/${c}`;
  args = [{type: "f", value: v / 255.0}];
  return {address, args};
};

OSCDriver.prototype.sendUniverse = function() {
  for (const i in this.universe) {
    const m = this.createMsg(i, this.universe[i]);
    this.dev.send(m);
  }
};

OSCDriver.prototype.start = function() {
  // this.timeout = setInterval(this.sendUniverse.bind(this), this.sleepTime);
};

OSCDriver.prototype.stop = function() {
  // clearInterval(this.timeout);
};

OSCDriver.prototype.close = function(cb) {
  if (this.dev ) { this.dev.close(); }
  this.stop();
  cb(null);
};

OSCDriver.prototype.update = function(u) {
  for (const c in u) {
    this.universe[c] = u[c];
    const m = this.createMsg(c, this.universe[c]);
    this.dev.send(m);
  }
};

OSCDriver.prototype.updateAll = function(v) {
  for (let i = 1; i <= this.bufSize ; i++) {
    this.universe[i] = v;
    const m = this.createMsg(i, this.universe[i]);
    this.dev.send(m);
  }
};

OSCDriver.prototype.get = function(c) {
  return this.universe[c];
};

util.inherits(OSCDriver, EventEmitter);

module.exports = OSCDriver;
