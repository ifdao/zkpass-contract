/**
 * This file specifies how to run the `ZkPass` smart contract locally using the `Mina.LocalBlockchain()` method.
 * The `Mina.LocalBlockchain()` method specifies a ledger of accounts and contains logic for updating the ledger.
 *
 * Please note that this deployment is local and does not deploy to a live network.
 * If you wish to deploy to a live network, please use the zkapp-cli to deploy.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/index.js`.
 */
import {
  deploy,
  createLocalBlockchain,
  ZkPassApp,
} from './zkpass.js';
import { PrivateKey, shutdown } from 'snarkyjs';

// setup
const account = createLocalBlockchain();
const sk = PrivateKey.random();
const zkAppAddress = sk.toPublicKey();
const app = new ZkPassApp(zkAppAddress);

console.log('Deploying zkpass...');
await deploy(app, sk, account);

// cleanup
await shutdown();
