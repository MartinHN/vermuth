const GPIODriverClass = require('./dmxGPIODriver')
import dmxController from './dmxController'

var SolenoidDriver = function() {};

const proto = new GPIODriverClass

const onGpios:{[id:number]:Date} = {}
var maxOnTime = 500;
var timer = null;
function stopTimer(){
  if(timer){
    clearInterval(timer)
    timer=null
  }
}

function startTimerIfNotRunning(){
  if(timer===null){
    timer = setInterval(()=>{

      const cD = new Date()

      for(var i in onGpios){
        if((cD.getTime() - onGpios[i].getTime())>maxOnTime){
          dmxController.setCircs([{c:i,v:0}],null)
        }
      }
    },maxOnTime)
  }
}


proto.syncGPIO = function(i){
  const isOn = this.universe[i]>0;
  // console.log("instance",this.gpioInstances)
  this.gpioInstances[i].digitalWrite(isOn);
  if(isOn){onGpios[i]=new Date()}
  else{delete onGpios[i]}
  const numOn = Object.keys(onGpios).length;
  if(numOn==0){
    stopTimer()
  }
  else{
    startTimerIfNotRunning();
  }
}

SolenoidDriver.prototype = proto


module.exports = SolenoidDriver;