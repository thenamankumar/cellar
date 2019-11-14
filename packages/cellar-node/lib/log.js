class Log {
  #key;
  #value;
  #action;
  #term;
  #position;

  constructor({ key, value, action, term = -1, position = -1 } = {}) {
    this.#key = key;
    this.#value = value;
    this.#action = action;
    this.#term = Number(term);
    this.#position = Number(position);
  }

  get key() {
    return this.#key;
  }

  get value() {
    return this.#value;
  }

  get action() {
    return this.#action;
  }

  get term() {
    return this.#term;
  }

  get position() {
    return this.#position;
  }
}

module.exports = Log;
