import { readContract, getPublicClient, simulateContract } from "@wagmi/core";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { decodeEventLog, getAddress, padHex } from "viem";
import { config as appConfig } from "../config";
import { wagmiAdapter } from "../config/appkit";
import abi from "../config/abi.json";


// React hook variant using wagmi hooks to expose loading states
export function useMintNFT() {
    const {
        data: txHash,
        writeContractAsync,
        isPending: isWriting,
        error: writeError,
        reset,
    } = useWriteContract();

    const {
        data: receipt,
        isLoading: isConfirming,
        isSuccess,
        error: confirmError,
    } = useWaitForTransactionReceipt({ hash: txHash });

    const mint = async ({ publicMetadataUrl, toAddress, unlockTimestamp, encryptedPrivateMetadataHash }) => {
        const hash = await writeContractAsync({
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: "safeMint",
            args: [toAddress, publicMetadataUrl, unlockTimestamp, encryptedPrivateMetadataHash],
        });
        return hash;
    };

    let minted;
    if (receipt?.logs) {
        for (const log of receipt.logs) {
            try {
                const parsed = decodeEventLog({ abi, data: log.data, topics: log.topics });
                if (parsed.eventName === "Transfer") {
                    const tokenId = parsed.args.tokenId?.toString();
                    minted = { tokenId: appConfig.hedera.capsulaAddress, serialNumber: tokenId };
                    break;
                }
            } catch (e) {
                console.error("Failed to parse transfer event:", e);
            }
        }
    }

    const status = writeError || confirmError
        ? "error"
        : isSuccess
            ? "success"
            : isConfirming
                ? "confirming"
                : isWriting
                    ? "pending"
                    : "idle";

    return {
        mint,
        txHash,
        receipt,
        isWriting,
        isConfirming,
        isSuccess,
        error: writeError || confirmError || null,
        status,
        result: minted || null,
        reset,
    };
}

// Read user's NFTs from the deployed ERC721 contract via logs and tokenURI
export async function fetchUserNFTs(ownerAddress) {
    try {
        const publicClient = getPublicClient(wagmiAdapter.wagmiConfig);
        const contractAddress = appConfig.hedera.capsulaAddress;
        const owner = getAddress(ownerAddress);

        // ERC-721 Transfer event topic (keccak256("Transfer(address,address,uint256)"))
        const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        const topicFrom = padHex(owner.toLowerCase(), { size: 32 });
        const topicTo = padHex(owner.toLowerCase(), { size: 32 });

        // Get a recent block number and chunk the query to avoid Hedera's time limit
        const latestBlock = await publicClient.getBlockNumber();
        const oneDayBlocks = BigInt(Math.floor(1 * 24 * 60 * 60 / 2)); // Approximate blocks in 1 day (2s per block)
        const maxRange = latestBlock - 1000n; // Go back at least 1000 blocks

        // Query in chunks of 1 day to avoid time limit
        const incoming = [];
        const outgoing = [];

        let fromBlock = latestBlock - oneDayBlocks;
        let queryCount = 0;
        const maxQueries = 7; // Limit to 7 days maximum

        while (fromBlock <= latestBlock && queryCount < maxQueries) {
            const toBlock = Math.min(Number(fromBlock + oneDayBlocks), Number(latestBlock));

            console.log(`Querying logs from block ${fromBlock} to ${toBlock} (chunk ${queryCount + 1})`);

            try {
                // Incoming transfers (to = owner)
                const incomingChunk = await publicClient.getLogs({
                    address: contractAddress,
                    topics: [TRANSFER_TOPIC, null, topicTo],
                    fromBlock: fromBlock,
                    toBlock: BigInt(toBlock),
                });
                incoming.push(...incomingChunk);

                // Outgoing transfers (from = owner)
                const outgoingChunk = await publicClient.getLogs({
                    address: contractAddress,
                    topics: [TRANSFER_TOPIC, topicFrom, null],
                    fromBlock: fromBlock,
                    toBlock: BigInt(toBlock),
                });
                outgoing.push(...outgoingChunk);

                queryCount++;
                fromBlock = BigInt(toBlock) + 1n;

                // If we've covered enough range, break
                if (fromBlock >= maxRange) {
                    break;
                }
            } catch (error) {
                console.warn(`Failed to query chunk ${queryCount + 1}:`, error);
                // If chunk fails, try with smaller range
                fromBlock += oneDayBlocks / 2n;
                queryCount++;
            }
        }

        // Compute current ownership by tokenId
        const owned = new Set();
        for (const log of incoming) {
            try {
                const parsed = decodeEventLog({ abi, data: log.data, topics: log.topics });
                if (parsed.eventName === "Transfer" && getAddress(parsed.args.to) === owner) {
                    owned.add(parsed.args.tokenId.toString());
                }
            } catch (e) {
                console.error("Failed to parse incoming transfer:", e);
            }
        }
        for (const log of outgoing) {
            try {
                const parsed = decodeEventLog({ abi, data: log.data, topics: log.topics });
                if (parsed.eventName === "Transfer" && getAddress(parsed.args.from) === owner) {
                    owned.delete(parsed.args.tokenId.toString());
                }
            } catch (e) {
                console.error("Failed to parse outgoing transfer:", e);
            }
        }

        const tokenIds = Array.from(owned.values());
        const results = await Promise.all(
            tokenIds.map(async (tid) => {
                try {
                    const uri = await readContract(wagmiAdapter.wagmiConfig, {
                        address: contractAddress,
                        abi,
                        functionName: "tokenURI",
                        args: [BigInt(tid)],
                    });
                    return {
                        tokenId: contractAddress,
                        serialNumber: tid,
                        metadata: uri,
                    };
                } catch (e) {
                    console.error("Failed to fetch NFT metadata:", e);
                    return null;
                }
            })
        );

        return results.filter(Boolean);
    } catch (error) {
        console.error("Failed to fetch NFTs from contract:", error);

        // If it's a Hedera time limit error, return empty array instead of throwing
        if (error.message?.includes("exceed the maximum allowed duration of 7 days")) {
            console.warn("Hedera query time limit exceeded, returning empty contract data");
            return [];
        }

        throw new Error("Failed to fetch your capsules. Please try again.");
    }
}


export async function fetchNFTMetadata(ipfsUrl) {
    try {
        // Convert IPFS URL to HTTP URL using Infura gateway
        const gatewayUrl = ipfsUrl;

        const response = await fetch(gatewayUrl);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch NFT metadata:", error);
        throw new Error("Failed to load capsule metadata. Please try again.");
    }
}

/**
 * Get private metadata hash from the contract (owner-only access)
 * @param {string} tokenId - The token ID
 * @returns {Promise<string>} The encrypted private metadata hash
 */
export async function getPrivateMetadataHash(tokenId, account) {
    try {

        const encryptedHash = await readContract(wagmiAdapter.wagmiConfig, {
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: "getPrivateMetadataHash",
            args: [BigInt(tokenId)],
            account


        });

        return encryptedHash;
    } catch (error) {
        console.error("Failed to get private metadata hash:", error);
        throw new Error("Failed to access private metadata. Make sure you own this NFT.");
    }
}

/**
 * Get unlock timestamp from the contract
 * @param {string} tokenId - The token ID
 * @returns {Promise<number>} The unlock timestamp
 */
export async function getUnlockTimestamp(tokenId) {
    try {

        const unlockTimestamp = await readContract(wagmiAdapter.wagmiConfig, {
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: "getUnlockTimestamp",
            args: [BigInt(tokenId)],
        });

        return Number(unlockTimestamp);
    } catch (error) {
        console.error("Failed to get unlock timestamp:", error);
        throw new Error("Failed to get unlock timestamp.");
    }
}

/**
 * Check if a capsule is unlocked
 * @param {string} tokenId - The token ID
 * @returns {Promise<boolean>} True if unlocked
 */
export async function isCapsuleUnlocked(tokenId) {
    try {

        const isUnlocked = await readContract(wagmiAdapter.wagmiConfig, {
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: "isUnlocked",
            args: [BigInt(tokenId)],
        });

        return isUnlocked;
    } catch (error) {
        console.error("Failed to check if capsule is unlocked:", error);
        throw new Error("Failed to check unlock status.");
    }
}

/**
 * Get the current owner of a token
 * @param {string} tokenId - The token ID
 * @returns {Promise<string>} Owner address
 */
export async function getTokenOwner(tokenId) {
    try {


        const owner = await readContract(wagmiAdapter.wagmiConfig, {
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
        });

        return owner;
    } catch (error) {
        console.error("Failed to get token owner:", error);
        throw new Error("Failed to get token owner.");
    }
}

/**
 * Get comprehensive capsule information from the contract
 * @param {string} tokenId - The token ID
 * @returns {Promise<Object>} Capsule information
 */
export async function getCapsuleInfo(tokenId) {
    try {


        const [owner, publicMetadataURI, unlockTimestamp, isUnlocked, hasPrivateMetadata] = await readContract(wagmiAdapter.wagmiConfig, {
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: "getCapsuleInfo",
            args: [BigInt(tokenId)],
        });

        return {
            owner,
            publicMetadataURI,
            unlockTimestamp: Number(unlockTimestamp),
            isUnlocked,
            hasPrivateMetadata
        };
    } catch (error) {
        console.error("Failed to get capsule info:", error);
        throw new Error("Failed to get capsule information.");
    }
}

// Gas estimation for minting
/**
 * Estimate gas cost for minting a capsule
 * @param {string} toAddress - Address to mint to
 * @param {string} publicMetadataUrl - Public metadata URL
 * @param {number} unlockTimestamp - Unlock timestamp
 * @param {string} encryptedPrivateMetadataHash - Encrypted private metadata hash
 * @returns {Promise<{gasLimit: bigint, gasPrice: bigint, estimatedCost: string}>}
 */
export async function estimateMintGas(toAddress, publicMetadataUrl, unlockTimestamp, encryptedPrivateMetadataHash) {
    try {
        console.log('🔍 Estimating gas for mint operation...');

        // Simulate the contract call to get gas estimate
        const result = await simulateContract(wagmiAdapter.wagmiConfig, {
            address: appConfig.hedera.capsulaAddress,
            abi,
            functionName: 'safeMint',
            args: [toAddress, publicMetadataUrl, BigInt(unlockTimestamp), encryptedPrivateMetadataHash],
        });


        // Calculate estimated cost in HBAR (assuming 1 HBAR = 10^8 tinybars)

        const publicClient = getPublicClient(wagmiAdapter.wagmiConfig);
        const gasPriceInHbar = await publicClient.getGasPrice() / 1000000000n;
        const gas = result.result;



        const estimatedCostInHbar = gas * gasPriceInHbar;



        return {
            gasLimit: gas,
            gasPrice: gasPriceInHbar,
            estimatedCost: estimatedCostInHbar

        };
    } catch (error) {
        console.error('❌ Failed to estimate gas:', error);
        // Return fallback estimate
        return {
            gasLimit: 200000n,
            gasPrice: 1000000000n, // 0.01 HBAR per gas
            estimatedCost: '0.5',
            estimatedCostTinybars: 100000000000n
        };
    }
}