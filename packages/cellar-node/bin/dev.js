const cp = require('child_process');
const Client = require('../lib/client');
const Node = require('../lib/node');

const addresses = ['127.0.0.1:5001', '127.0.0.1:5002', '127.0.0.1:5003', '127.0.0.1:5004', '127.0.0.1:5005'];

const nodes = addresses.map((address, index) => {
  const data = {
    id: index,
    address,
    followers: addresses
      .filter(followerAddress => followerAddress !== address)
      .map(followerAddress => ({ address: followerAddress })),
  };

  /* cp.fork(__dirname + '/run.js', {
    env: {
      ...data,
      followers: data.followers.join(' '),
      PATH: process.env.PATH,
    },
  });*/
  /*
  const node = new Node(data);
  node.listen();
  node.start();
  */

  return data;
});

setTimeout(async () => {
  const clients = nodes.map(
    node =>
      new Client({
        address: node.address,
      }),
  );

  setInterval(() => {
    return;
    clients.forEach(async client => {
      const status = await client.requestStatus();
      if (!status) return console.log(`${client.address} unreachable.`);

      console.log(`Node: ${status.id}`);
      console.log(status);
    });
    console.log('\n\n');
  }, 1000);

  let leader = null;
  const getRandomClient = () => clients[Math.floor(Math.random() * clients.length)];

  const setValue = async (action, key, value, client = leader || getRandomClient()) => {
    console.log('retrying');
    const response = await client[action]({ key, value });
    console.log('response', action, response, await client.id);

    if (response.success) {
      leader = client;
      return response;
    }
    if (response.leaderId !== null && action !== 'get') {
      const newLeader =
        clients[
          (await Promise.all(clients.map(async _client => await _client.id))).findIndex(id => {
            console.log('id', id);
            return id == response.leaderId;
          })
        ];

      console.log('new leader: ', await newLeader.id);
      return setValue(action, key, value, newLeader);
    }

    return setValue(key, value);
  };

  if (1) {
    await setValue('set', 'c', 'a');
    await setValue('get', 'c');
    await setValue('remove', 'c');
    await setValue('get', 'c');
    await setValue('set', 'c', 'a');
  }
}, 1000);
