

const timers: {[key: string]: any} = {};

export function  doTimer(name: string, length: number, resolution: number, oninstance: (steps: number, count: number) => void, oncomplete?: () => void ) {
  const steps = length / resolution;
  const speed = resolution;
  let count = 0;
  const start = new Date().getTime();

  function instance() {
    if (++count === steps) {
      oninstance(steps, count);
      if (oncomplete) {oncomplete(); }
    } else {
      oninstance(steps, count);

      const diff = (new Date().getTime() - start) - (count * speed);
      timers[name] = setTimeout(instance, Math.max(0, speed - diff));
    }
  }
  oninstance(steps, count);
  stopTimer(name);
  timers[name] = setTimeout(instance, speed);
}

export function stopTimer(name: string) {
    if (timers[name]) {
    clearTimeout(timers[name]);
    delete timers[name];
  }
}




