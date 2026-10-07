import { base44 } from '@/api/base44Client';

let clientPromise;

export default function reownClient() {
  if (!clientPromise) {
    clientPromise = Promise.all([
      base44.functions.invoke('getWalletConnectConfig', {}),
      import('@reown/appkit'),
      import('@reown/appkit/networks'),
      import('@reown/appkit-adapter-solana'),
      import('@solana/wallet-adapter-wallets'),
    ]).then(([config, { createAppKit }, { solana }, { SolanaAdapter }, wallets]) => {
      if (!config.data?.projectId) throw new Error(config.data?.error || 'WalletConnect is not configured.');
      const network = { ...solana, rpcUrls: { default: { http: ['https://solana-rpc.publicnode.com'] } } };
      return createAppKit({
        adapters: [new SolanaAdapter({
          wallets: [new wallets.PhantomWalletAdapter(), new wallets.SolflareWalletAdapter(), new wallets.TorusWalletAdapter(), new wallets.LedgerWalletAdapter()],
          registerWalletStandard: false,
        })],
        projectId: config.data.projectId,
        networks: [network],
        defaultNetwork: network,
        metadata: {
          name: 'Etherene',
          description: 'Etherene sovereign digital identity',
          url: window.location.origin,
          icons: ['https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693568c43d156a928d236e54/9ccbd4280_logo.png'],
        },
        themeMode: 'light',
        enableReconnect: false,
        enableWalletConnect: true,
        enableNetworkSwitch: false,
        themeVariables: { '--w3m-z-index': 10002 },
        features: { email: false, socials: false, swaps: false, onramp: false, history: false, analytics: false },
      });
    }).catch(error => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}