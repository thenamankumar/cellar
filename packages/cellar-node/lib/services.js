const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(__dirname + '/rpc.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  oneofs: true,
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const services = protoDescriptor.cellar;

module.exports = services;
