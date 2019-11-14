const grpc = require('grpc');
const services = require('./services');
const RPCService = require('./utils').RPCService;

class Follower {
  #address;
  #nextIndex;
  #matchIndex;
  #services;

  constructor({ address, lastLogIndex }) {
    this.#address = address;
    this.#nextIndex = lastLogIndex + 1;
    this.#matchIndex = -1;
    this.#services = new services.Follower(address, grpc.credentials.createInsecure());
  }

  get details() {
    return { nextIndex: this.#nextIndex, matchIndex: this.#matchIndex };
  }

  get nextIndex() {
    return this.#nextIndex;
  }

  set nextIndex(value) {
    if (value < this.#nextIndex) throw 'Not allowed to set lower than the current value.';
    if (value < this.#matchIndex) throw 'Not allowed to set lower than or equal to match index.';

    return (this.#nextIndex = value);
  }

  get matchIndex() {
    return this.#matchIndex;
  }

  set matchIndex(value) {
    if (value < this.#matchIndex) throw 'Not allowed to set lower than the current value.';

    return (this.#matchIndex = value);
  }

  decreaseNextIndex = () => {
    if (this.#nextIndex === 0) return 0;

    return --this.#nextIndex;
  };

  requestVote = RPCService((...args) => this.#services.requestVote(...args), {
    defaults: { term: -1, voteGranted: false },
    transform: (err, response) => ({
      ...response,
      term: Number(response.term),
    }),
  });

  appendEntries = RPCService((...args) => this.#services.appendEntries(...args), {
    defaults: { term: -1, success: false },
    transform: (err, response) => ({
      ...response,
      term: Number(response.term),
    }),
  });
}

module.exports = Follower;
