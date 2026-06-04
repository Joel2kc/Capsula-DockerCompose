import { useState, useEffect } from "react";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { useAppKitAccount } from "@reown/appkit/react";
import { config } from "../config";

export function useHederaClient() {
    const { address } = useAppKitAccount();
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!address) return;

        try {
            // Initialize Hedera client based on network config
            const client = config.hedera.network === "mainnet"
                ? Client.forMainnet()
                : Client.forTestnet();

            // Get operator from config
            const operatorId = AccountId.fromString(config.hedera.operatorId);
            const operatorKey = PrivateKey.fromString(config.hedera.operatorKey);

            // Set operator
            client.setOperator(operatorId, operatorKey);

            setClient(client);
        } catch (err) {
            console.error("Failed to initialize Hedera client:", err);
            setError(err.message);
        }
    }, [address]);

    return {
        client,
        error,
        isReady: !!client,
        signer: client
            ? {
                client,
                accountId: config.hedera.operatorId,
                privateKey: PrivateKey.fromString(config.hedera.operatorKey),
            }
            : null,
    };
}
