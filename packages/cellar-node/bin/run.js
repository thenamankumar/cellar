const Node = require('../lib/node');

const env = process.env;

console.log(env);

const node = new Node({
  id: env.id,
  address: env.address,
  followers: env.followers
    .split(' ')
    .filter(address => address !== env.address)
    .map(address => ({ address: address })),
});

node.listen();
setTimeout(node.start, 200);
