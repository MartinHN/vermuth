import dmxController from './dmxController';
if (process.env.CUSTOM_PI_DRIVERS) {
  const GPIODriverClass = require('./dmxGPIODriver');


  const SolenoidDriver = function() {};

  const proto = new GPIODriverClass;

  const onGpios: {[id: number]: Date} = {};
  const maxOnTime = 30;
  let timer:any = null;
  function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

  function startTimerIfNotRunning() {
  if (timer === null) {
    timer = setInterval(() => {

      const cD = new Date();

      for (const i in onGpios) {
        if ((cD.getTime() - onGpios[i].getTime()) > maxOnTime) {
          dmxController.setCircs([{c: parseInt(i, 10), v: 0}], null);
        }
      }
    }, maxOnTime);
  }
}


  proto.syncGPIO = function(i) {
  const isOn = this.universe[i] > 0;
  // console.log("instance",this.gpioInstances)
  this.gpioInstances[i].pwmWrite(isOn);
  if (isOn) {onGpios[i] = new Date(); } else {delete onGpios[i]; }
  const numOn = Object.keys(onGpios).length;
  if (numOn === 0) {
    stopTimer();
  } else {
    startTimerIfNotRunning();
  }
};

  SolenoidDriver.prototype = proto;


  module.exports = SolenoidDriver;
} else {
  module.exports = {};
}
