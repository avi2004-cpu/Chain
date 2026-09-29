import * as grpc from '@grpc/grpc-js';
import { connect, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Config is read lazily (not at import time) so the server can start and
// report a clear error instead of crashing when .env is missing/incomplete.
function config() {
  const cryptoPath = process.env.FABRIC_CRYPTO_PATH; // .../organizations/peerOrganizations/org1.example.com
  if (!cryptoPath) {
    throw new Error('FABRIC_CRYPTO_PATH is not set - copy backend/.env.example to backend/.env and fill it in');
  }
  return {
    channelName: process.env.FABRIC_CHANNEL_NAME || 'mychannel',
    mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
    peerEndpoint: process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051',
    peerHostAlias: process.env.FABRIC_PEER_HOST_ALIAS || 'peer0.org1.example.com',
    keyDirectoryPath: path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'),
    certDirectoryPath: path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts'),
    tlsCertPath: path.join(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
  };
}

let gatewayInstance = null;
let clientInstance = null;

async function getFirstFileInDir(dirPath) {
  const files = await fs.readdir(dirPath);
  if (files.length === 0) throw new Error(`No files found in ${dirPath}`);
  return path.join(dirPath, files[0]);
}

async function newGrpcConnection(cfg) {
  const tlsRootCert = await fs.readFile(cfg.tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(cfg.peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': cfg.peerHostAlias,
  });
}

async function newIdentity(cfg) {
  const certPath = await getFirstFileInDir(cfg.certDirectoryPath);
  const credentials = await fs.readFile(certPath);
  return { mspId: cfg.mspId, credentials };
}

async function newSigner(cfg) {
  const keyPath = await getFirstFileInDir(cfg.keyDirectoryPath);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

export async function getGateway() {
  if (gatewayInstance) return gatewayInstance;
  const cfg = config();
  clientInstance = await newGrpcConnection(cfg);
  gatewayInstance = connect({
    client: clientInstance,
    identity: await newIdentity(cfg),
    signer: await newSigner(cfg),
    // Generous deadlines: first endorsement on WSL2 / 8GB machines is slow.
    evaluateOptions: () => ({ deadline: Date.now() + 10_000 }),
    endorseOptions: () => ({ deadline: Date.now() + 20_000 }),
    submitOptions: () => ({ deadline: Date.now() + 10_000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60_000 }),
  });
  return gatewayInstance;
}

export async function getContract(chaincodeName) {
  const gateway = await getGateway();
  return gateway.getNetwork(config().channelName).getContract(chaincodeName);
}

export function closeConnection() {
  gatewayInstance?.close();
  clientInstance?.close();
  gatewayInstance = null;
  clientInstance = null;
}

export function decode(bytes) {
  return Buffer.from(bytes).toString('utf8');
}