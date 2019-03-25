



export function  doTimer(length: number, resolution: number, oninstance: (steps: number, count: number) => void, oncomplete?: () => void ) {
  const steps = length / resolution;
  const speed = resolution;
  let count = 0;
  const start = new Date().getTime();

  function instance() {
    if (count++ === steps) {
      oninstance(steps, count);
      if (oncomplete) {oncomplete(); }
    } else {
      oninstance(steps, count);

      const diff = (new Date().getTime() - start) - (count * speed);
      window.setTimeout(instance, Math.max(0, speed - diff));
    }
  }
  oninstance(steps, count);
  window.setTimeout(instance, speed);
}

class TimeClass {

  constructor() {

  }

}


export const Time = new TimeClass();
