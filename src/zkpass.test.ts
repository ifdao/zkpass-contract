import {
  deploy,
  verify,
  createLocalBlockchain,
  ZkPassApp,
} from './zkpass';
import { isReady, shutdown, PrivateKey, PublicKey } from 'snarkyjs';

describe('zkpass', () => {
  let app: ZkPassApp,
    sk: PrivateKey,
    pk: PublicKey,
    account: PrivateKey;

  beforeEach(async () => {
    await isReady;
    account = createLocalBlockchain();
    sk = PrivateKey.random();
    pk = sk.toPublicKey();
    app = new ZkPassApp(pk);
    return;
  });

  afterAll(async () => {
    setTimeout(shutdown, 0);
  });

  it('deploy zkpass', async () => {
    await deploy(app, sk, account);
  });

  it('verify success', async () => {
    await deploy(app, sk, account);
    let accepted = await verify(account,pk,account);
    expect(accepted).toBe(true);
  });
});