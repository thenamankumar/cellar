const get = async (req, client) => {
  try {
    const result = await client.get({ key: req.body.key });
    if (result.success) {
      console.log(result);
      global.leader = client;
      return result;
    } else if (result.leaderId) {
      global.leader = req.clients.find(_client => _client.id === result.leaderId);
      return get(req, global.leader);
    }
  } catch (err) {
    console.log('fetching other client');
    return get(req.clients[Math.floor(Math.random() * clients.length)]);
  }
};

module.exports = async (req, res) => {
  return res.send(await get(req, req.leader));
};
