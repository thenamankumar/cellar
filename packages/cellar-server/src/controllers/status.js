module.exports = async (req, res) => {
  const statuses = await Promise.all(
    req.clients.map(async client => {
      try {
        const status = await client.requestStatus();

        if (status === null) {
          return { id: await client.id, address: client.address, down: true };
        }

        return status;
      } catch (err) {
        return { id: await client.id, address: client.address, down: true };
      }
    }),
  );

  res.send({ status: statuses });
};
