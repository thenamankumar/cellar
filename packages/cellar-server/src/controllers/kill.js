module.exports = async (req, res) => {
  if (!req.body) return res.send({ success: false });
  const client = req.clients.find(_client => _client.id === req.body.id);

  if (!client) return res.send({ success: false });

  try {
    await client.kill();
    res.send({ success: false });
  } catch (err) {
    console.log(err);

    res.send({ success: false });
  }
};
