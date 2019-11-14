const grpc = require('grpc');
const services = require('./services');
const RPCService = require('./utils').RPCService;

class Client {
  #address;
  #services;

  constructor({ address }) {
    this.#address = address;
    this.#services = new services.Client(address, grpc.credentials.createInsecure());
  }

  get address() {
    return this.#address;
  }

  get id() {
    return this.requestStatus().then(status => (status ? status.id : undefined));
  }

  kill = RPCService((...args) => this.#services.kill({}, ...args), {
    defaults: {},
  });

  requestStatus = RPCService((payload, ...args) => this.#services.requestStatus({}, ...args), {
    defaults: null,
    transform: (err, response) => {
      if (err) throw err;

      if (response === null) return null;

      return {
        ...response,
        term: Number(response.term),
        commitIndex: Number(response.commitIndex),
        lastApplied: Number(response.lastApplied),
        lastLogIndex: Number(response.lastLogIndex),
      };
    },
  });

  set = RPCService((...args) => this.#services.set(...args), {
    defaults: {
      success: false,
      leaderId: null,
    },
  });

  get = RPCService((...args) => this.#services.get(...args), {
    defaults: {
      success: false,
      leaderId: null,
    },
  });

  remove = RPCService((...args) => this.#services.remove(...args), {
    defaults: {
      success: false,
      leaderId: null,
    },
  });
}

module.exports = Client;
