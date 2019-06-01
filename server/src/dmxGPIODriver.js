const isPi = require('detect-rpi')();
if (isPi){
  const Gpio = require('pigpio').Gpio;
}
else{
class GPIO{
  constructor(i,d){};

  pwmWrite(v){
    console.log(v);
  }
}
}
/*


      GPIO    pin     pin GPIO  
3V3     -     1       2     -     5V
SDA     2     3       4     -     5V
SCL     3     5       6     -     Ground
        4     7       8     14    TXD
Ground  -     9       10    15    RXD
ce1     17    11      12    18    ce0
        27    13      14    -     Ground
        22    15      16    23  
3V3     -     17      18    24  
MOSI    10    19      20    -   Ground
MISO    9     21      22    25  
SCLK    11    23      24     8    CE0
Ground  -     25      26     7    CE1
ID_SD   0     27      28     1   ID_SC
        5     29      30    -    Ground
        6     31      32    12  
        13    33      34     -    Ground
miso    19    35      36    16    ce2
        26    37      38    20    mosi
Ground  -     39      40    21    sclk
*/


function GPIODriver(options = {}) {
  
  this.gpioInstances = []
  for (var i = 2 ; i <= 27 ; i++){
   this.gpioInstances.add(new Gpio(i,{mode:Gpio.OUTPUT}))
  }
  this.bufSize = this.gpioInstances.length
  this.universe = Buffer.alloc(this.bufSize +1);
  this.universe.fill(0);
  this.sendUniverse();
  
}

 
GPIODriver.prototype.syncGPIO = function(i){
  this.gpioInstance[i].pwmWrite(this.universe[i])
}

GPIODriver.prototype.sendUniverse = function () {
  for(const i in this.universe){
    this.syncGPIO(i)
    
  }
};

GPIODriver.prototype.start = function () {
  // this.timeout = setInterval(this.sendUniverse.bind(this), this.sleepTime);
};

GPIODriver.prototype.stop = function () {
  // clearInterval(this.timeout);
};

GPIODriver.prototype.close = function (cb) {
  if(this.dev ) this.dev.close()
  this.stop();
  cb(null);
};

GPIODriver.prototype.update = function (u) {
  for (const c in u) {
    this.universe[c] = u[c];
    this.syncGPIO(c);
  }
};

GPIODriver.prototype.updateAll = function (v) {
  for (let i = 0; i < this.bufSize ; i++) {
    this.universe[i] = v;
    this.syncGPIO(c);
  }
};

GPIODriver.prototype.get = function (c) {
  return this.universe[c];
};

module.exports = GPIODriver;