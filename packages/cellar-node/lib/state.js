class State {
  #logger;
  #state = {};

  constructor(logger) {
    this.#logger = logger;
  }

  apply = (...logs) => {
    logs.forEach(log => {
      switch (log.action) {
        case 'SET':
          this.#logger(`SET "${log.key}" = "${log.value}"`, { term: log.term, position: log.position });
          this.#state[log.key] = log.value;
          break;
        case 'REMOVE':
          this.#logger(`REMOVE "${log.key}"`, { term: log.term, position: log.position });
          delete this.#state[log.key];
          break;
      }
    });
  };

  get = key => this.#state[key];
}

module.exports = State;
