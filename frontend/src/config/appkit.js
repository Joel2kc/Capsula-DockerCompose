import { createAppKit } from '@reown/appkit/react';
import { hedera, hederaTestnet } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient } from '@tanstack/react-query';
import { config } from './index';

// Create QueryClient
export const queryClient = new QueryClient();

// Set networks
const networks = [hederaTestnet, hedera];

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({

    projectId: config.reown.projectId,
    chains: networks,
    networks,


});

// Initialize AppKit -
createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: config.reown.projectId,
    metadata: config.reown.metadata,
    features: {
        analytics: true
    }
});