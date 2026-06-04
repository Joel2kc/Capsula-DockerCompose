const requiredEnvVar = (name) => {
    const value = import.meta.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

export const config = {
    hedera: {
        operatorId: requiredEnvVar("VITE_HEDERA_OPERATOR_ID"),
        operatorKey: requiredEnvVar("VITE_HEDERA_OPERATOR_KEY"),
        network: import.meta.env.VITE_HEDERA_NETWORK || "testnet",
        capsulaAddress: requiredEnvVar("VITE_HEDERA_CAPSULA_ADDRESS"),
    },
    ipfs: {
        projectId: requiredEnvVar("VITE_INFURA_IPFS_PROJECT_ID"),
        projectSecret: requiredEnvVar("VITE_INFURA_IPFS_PROJECT_SECRET"),
        gateway: requiredEnvVar("VITE_INFURA_IPFS_GATEWAY"),
    },
    reown: {
        projectId: requiredEnvVar("VITE_REOWN_PROJECT_ID"),
        metadata: {
            name: "Capsula",
            description: "Messages for Tomorrow, Minted Today",
            url: import.meta.env.VITE_APP_URL || "http://localhost:5173",
            icons: [`${import.meta.env.VITE_APP_URL || "http://localhost:5173"}/favicon-96x96.png`],
        },
    },
    api: {
        url: requiredEnvVar("VITE_API_URL"),
    },
};