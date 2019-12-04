const set = async (req, client) => {
  try {
    const result = await client.set({ key: req.body.key, value: req.body.value });
    if (result.success) {
      global.leader = client;
      return result;
    } else if (result.leaderId) {
      global.leader = req.clients.find(_client => _client.id === result.leaderId);
      return set(req, global.leader);
    }
  } catch (err) {
    console.log(err);
    return set(req.clients[Math.floor(Math.random() * clients.length)]);
  }
};

module.exports = async (req, res) => {
  return res.send(await set(req, req.leader));
};
