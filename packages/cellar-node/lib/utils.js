module.exports.RPCService = (service, { defaults, transform } = {}) => payload => {
  return new Promise((resolve, reject) => {
    service(payload, async (err, response = defaults) => {
      if (err) console.log(err);

      if (typeof transform === 'function') {
        try {
          return resolve(await transform(err, response));
        } catch (err) {
          return defaults === undefined ? reject(err) : resolve(defaults);
        }
      }

      if (err) return defaults === undefined ? reject(err) : resolve(defaults);

      resolve(response);
    });
  });
};

module.exports.RPCController = (controller, { transform } = {}) => async (call, done) =>
  done(null, await controller(typeof transform === 'function' ? transform(call.request) : call.request));
