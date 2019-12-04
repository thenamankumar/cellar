const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const routes = require('./routes');
const bodyParser = require('body-parser');
const compression = require('compression');
const Client = require('../../cellar-node/lib/client');

const app = express();

const clients = ['127.0.0.1:5001', '127.0.0.1:5002', '127.0.0.1:5003', '127.0.0.1:5004', '127.0.0.1:5005'].map(
  address => new Client({ address }),
);

app.use(morgan('tiny'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(compression());

app.use((req, res, next) => {
  req.clients = clients;
  req.leader = global.leader || clients[Math.floor(Math.random() * clients.length)];
  next();
});

app.use('/', routes);

module.exports = app;
