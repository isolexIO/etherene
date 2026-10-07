import { BaseMessageSignerWalletAdapter, WalletReadyState, WalletConnectionError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';
import reownClient from '@/components/wallet/reownClient';
import waitForReownConnection from '@/components/wallet/waitForReownConnection';

// Keep the existing useWallet() contract without routing WalletConnect signing
// through Reown's Wallet Standard shim (which changes transaction formats).
export default class ReownWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = 'Etherene Wallet';
  url = 'https://etherene.info';
  icon = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693568c43d156a928d236e54/9ccbd4280_logo.png';
  readyState = WalletReadyState.Loadable;
  supportedTransactionVersions = new Set(['legacy', 0]);
  publicKey = null;
  connecting = false;
  _provider = null;
  _client = null;
  _subscriptions = [];

  // Neither stored wallet selection nor a restored session can auto-authorize.
  async autoConnect() {}

  async connect() {
    if (this.connected || this.connecting) return;
    this.connecting = true;
    try {
      this._client = await reownClient();
      await waitForReownConnection(this._client);
      this._subscriptions = [
        this._client.subscribeAccount(() => this._sync(), 'solana'),
        this._client.subscribeProviders(() => this._sync()),
      ];
      this._sync();
      if (!this.connected) throw new Error('The wallet did not return a Solana account.');
    } catch (error) {
      this._clear();
      throw new WalletConnectionError(error.message || 'Wallet connection failed.', error);
    } finally {
      this.connecting = false;
    }
  }

  _sync() {
    const account = this._client.getAccount('solana');
    if (!account?.isConnected || !account.address) {
      this._clear();
      return;
    }
    const provider = this._client.getWalletProvider();
    if (!provider) return;
    this._provider = provider;
    if (this.publicKey?.toBase58() !== account.address) {
      this.publicKey = new PublicKey(account.address);
      this.emit('connect', this.publicKey);
    }
  }

  _clear() {
    this._subscriptions.forEach(unsubscribe => unsubscribe());
    this._subscriptions = [];
    const wasConnected = !!this.publicKey;
    this.publicKey = null;
    this._provider = null;
    if (wasConnected) this.emit('disconnect');
  }

  async disconnect() {
    try {
      await this._client?.disconnect('solana');
    } finally {
      this._clear();
    }
  }

  closeModal() {
    return this._client?.close();
  }

  _requireProvider() {
    if (!this.connected || !this._provider) throw new WalletNotConnectedError();
    return this._provider;
  }

  async signMessage(message) {
    return this._requireProvider().signMessage(message);
  }

  async signTransaction(transaction) {
    // Pass through both legacy and v0 transactions, including server signatures.
    return this._requireProvider().signTransaction(transaction);
  }
}