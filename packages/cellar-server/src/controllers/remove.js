const remove = async (req, client) => {
  try {
    const result = await client.remove({ key: req.body.key });
    if (result.success) {
      global.leader = client;
      return result;
    } else if (result.leaderId) {
      global.leader = req.clients.find(_client => _client.id === result.leaderId);
      return remove(req, global.leader);
    }
  } catch (err) {
    console.log(err);
    return remove(req.clients[Math.floor(Math.random() * clients.length)]);
  }
};

module.exports = async (req, res) => {
  return res.send(await remove(req, req.leader));
};
