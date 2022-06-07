import {
  Field,
  SmartContract,
  method,
  state,
  State,
  Permissions,
  Mina,
  Party,
  PrivateKey,
  PublicKey,
} from 'snarkyjs';

export { deploy, verify, createLocalBlockchain };

export class ZkPassApp extends SmartContract {
  @state(Field) lock = State<Field>();
  
  @method init() {
  }

  @method verify() {
  }
}

// helpers
function createLocalBlockchain(): PrivateKey {
  let Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);

  const account = Local.testAccounts[0].privateKey;
  return account;
}

async function deploy(
  app: ZkPassApp,
  sk: PrivateKey,
  account: PrivateKey
) {
  let tx = await Mina.transaction(account, () => {
    Party.fundNewAccount(account);
    app.deploy({ zkappKey: sk });
    app.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });

    app.init();
  });
  await tx.send().wait();
}

async function verify(
  account: PrivateKey,
  zkAppAddress: PublicKey,
  sk: PrivateKey
) {
  let tx = await Mina.transaction(account, () => {
    let zkApp = new ZkPassApp(zkAppAddress);
    zkApp.verify();
    zkApp.sign(sk);
  });
  try {
    await tx.send().wait();
    return true;
  } catch (err) {
    return false;
  }
}