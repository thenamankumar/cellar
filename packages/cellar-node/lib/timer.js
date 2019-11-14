class Timer {
  #period;
  #action;
  #callbacks;
  #runs;
  #interval;

  constructor(period, action, callbacks = {}) {
    this.#period = period;
    this.#action = action;
    this.#runs = 0;
    this.#callbacks = callbacks;
  }

  start = () => {
    if (this.running) return;

    this.#setInterval();
    if (typeof this.#callbacks.onStart === 'function') this.#callbacks.onStart({ runs: this.#runs });
  };

  startNow = () => {
    if (this.running) return;

    const result = this.#perform(false);
    this.start();

    return result;
  };

  reset = () => {
    if (!this.running) return;

    this.#interval = clearInterval(this.#interval);
    this.#setInterval();
    if (typeof this.#callbacks.onReset === 'function') this.#callbacks.onReset({ runs: this.#runs });
  };

  stop = () => {
    if (!this.running) return;

    this.#interval = clearInterval(this.#interval);
    this.#runs = 0;
    if (typeof this.#callbacks.onStop === 'function') this.#callbacks.onStop({ runs: this.#runs });
  };

  performNow = () => {
    this.reset();

    return this.#perform(false);
  };

  get running() {
    return !(this.#interval || { _destroyed: true })._destroyed;
  }

  get period() {
    if (typeof this.#period === 'function') return this.#period();

    return this.#period;
  }

  get runs() {
    return this.#runs;
  }

  #setInterval = () => {
    this.#interval = setInterval(this.#perform, this.period);
  };

  #perform = (intervalOver = true) => {
    this.#runs = this.#runs + 1;
    if (intervalOver && typeof this.#callbacks.onOver === 'function') this.#callbacks.onOver({ runs: this.#runs });

    return this.#action();
  };
}

module.exports = Timer;
