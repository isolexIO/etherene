export default function waitForReownConnection(client) {
  return new Promise((resolve, reject) => {
    let opened = false;
    let settled = false;
    const subscriptions = [];
    const finish = (error) => {
      if (settled) return;
      settled = true;
      subscriptions.forEach(unsubscribe => unsubscribe());
      if (error) reject(error);
      else resolve();
    };
    const check = () => {
      const account = client.getAccount('solana');
      const provider = client.getWalletProvider();
      if (account?.isConnected && account.address && provider) finish();
    };
    subscriptions.push(client.subscribeAccount(check, 'solana'));
    subscriptions.push(client.subscribeProviders(check));
    subscriptions.push(client.subscribeState(state => {
      if (state.open) opened = true;
      else if (opened) {
        // Account and provider updates can arrive just after the modal closes.
        queueMicrotask(() => {
          check();
          if (!client.getAccount('solana')?.isConnected) {
            const error = new Error('Wallet connection cancelled.');
            error.name = 'WalletConnectionCancelled';
            finish(error);
          }
        });
      }
    }));
    client.open({ view: 'Connect', namespace: 'solana' }).then(check, finish);
  });
}