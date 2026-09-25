import * as grpc from '@grpc/grpc-js';
import { connect, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const channelName = process.env.FABRIC_CHANNEL_NAME || 'mychannel';
const mspId = process.env.FABRIC_MSP_ID || 'Org1MSP';
const cryptoPath = process.env.FABRIC_CRYPTO_PATH; // .../organizations/peerOrganizations/org1.example.com
const peerEndpoint = process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051';
const peerHostAlias = process.env.FABRIC_PEER_HOST_ALIAS || 'peer0.org1.example.com';

const keyDirectoryPath = path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certDirectoryPath = path.join(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
const tlsCertPath = path.join(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');

let gatewayInstance = null;
let clientInstance = null;

async function getFirstFileInDir(dirPath) {
  const files = await fs.readdir(dirPath);
  if (files.length === 0) throw new Error(`No files found in ${dirPath}`);
  return path.join(dirPath, files[0]);
}

async function newGrpcConnection() {
  const tlsRootCert = await fs.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': peerHostAlias,
  });
}

async function newIdentity() {
  const certPath = await getFirstFileInDir(certDirectoryPath);
  const credentials = await fs.readFile(certPath);
  return { mspId, credentials };
}

async function newSigner() {
  const keyPath = await getFirstFileInDir(keyDirectoryPath);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

export async function getGateway() {
  if (gatewayInstance) return gatewayInstance;
  clientInstance = await newGrpcConnection();
  gatewayInstance = connect({
    client: clientInstance,
    identity: await newIdentity(),
    signer: await newSigner(),
  });
  return gatewayInstance;
}

export async function getContract(chaincodeName) {
  const gateway = await getGateway();
  return gateway.getNetwork(channelName).getContract(chaincodeName);
}

export function closeConnection() {
  gatewayInstance?.close();
  clientInstance?.close();
}