import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { config } from "../config";
import { fetchUserNFTs, estimateMintGas } from "../services/hedera";

const API_URL = config.api.url;

async function uploadToBackend({ file, message, unlockDate, address }) {
    const formData = new FormData();
    if (file) {
        formData.append("file", file);
    }
    formData.append("message", message);
    formData.append("unlock_date", unlockDate.toISOString());
    formData.append("creator_address", address);

    const response = await fetch(`${API_URL}/api/capsules/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to upload capsule");
    }

    const result = await response.json();
    return result;
}

export async function getCapsuleMetrics(address) {
    if (!address) return null;

    const response = await fetch(`${API_URL}/api/capsules/metrics/${address}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch metrics");
    }

    return response.json();
}

async function decryptMetadataHash({ encryptedHash, unlockDate, creatorAddress, contractAddress }) {
    const response = await fetch(`${API_URL}/api/capsules/decrypt-metadata`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            encryptedHash,
            unlockDate,
            creatorAddress,
            contractAddress,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to decrypt metadata");
    }

    return response.json();
}

export function useDecryptMetadata() {
    return useMutation({
        mutationFn: decryptMetadataHash,
        onError: (error) => {
            console.error("Failed to decrypt metadata:", error);
        },
    });
}

async function trackCapsuleCreation({ tokenId, serialNumber, address }) {
    if (!tokenId || !serialNumber || !address) return null;

    const response = await fetch(`${API_URL}/api/capsules/track`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tokenId: tokenId,
            serialNumber: serialNumber,
            address: address,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to track capsule");
    }

    return response.json();
}

export function useUploadCapsule() {
    return useMutation({
        mutationFn: uploadToBackend,
        onError: (error) => {
            console.error("Failed to upload capsule:", error);
        },
    });
}

export function useTrackCapsule() {
    return useMutation({
        mutationFn: trackCapsuleCreation,
        onError: (error) => {
            console.error("Failed to track capsule:", error);
        },
    });
}

async function getUserCapsules(address) {
    if (!address) return [];

    const response = await fetch(`${API_URL}/api/capsules/user/${address}`);

    if (!response.ok) {
        if (response.status === 404) {
            return []; // No capsules found
        }
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch capsules");
    }

    return response.json();
}

export function useUserCapsules(address) {
    return useQuery({
        queryKey: ["userCapsules", address],
        queryFn: () => getUserCapsules(address),
        enabled: !!address,
    });
}

async function getCapsuleById(address, capsuleId) {
    const response = await fetch(`${API_URL}/api/capsules/user/${address}/${capsuleId}`);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Capsule not found");
        }
        throw new Error(`Failed to fetch capsule: ${response.statusText}`);
    }

    return response.json();
}

export function useCapsuleById(address, capsuleId) {
    return useQuery({
        queryKey: ["capsule", address, capsuleId],
        queryFn: () => getCapsuleById(address, capsuleId),
        enabled: !!address && !!capsuleId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// Combined hook that merges backend capsule data with contract metadata
export function useCapsulesWithMetadata(address) {
    const { data: backendCapsules, isLoading: backendLoading, error: backendError } = useUserCapsules(address);
    const { data: contractNFTs } = useQuery({
        queryKey: ["contractNFTs", address],
        queryFn: () => fetchUserNFTs(address),
        enabled: !!address,
        retry: 1, // Only retry once
        retryDelay: 1000,
    });

    const isLoading = backendLoading;
    const error = backendError; // Only show backend errors, contract errors are non-critical

    // Merge backend data with contract metadata
    const capsules = useMemo(() => {
        if (!backendCapsules) return [];

        return backendCapsules.map(backendCapsule => {
            // Find matching contract NFT (if available)
            const contractNFT = contractNFTs?.find(nft =>
                nft.tokenId === backendCapsule.token_id &&
                nft.serialNumber === backendCapsule.serial_number
            );



            return {
                ...backendCapsule,
                // Add contract metadata if available
                metadata: contractNFT?.metadata,
                // Determine if locked based on backend data (more reliable)
                isLocked: !backendCapsule.is_unlocked,

            };
        });
    }, [backendCapsules, contractNFTs]);

    // Filter functions
    const getLockedCapsules = () => capsules.filter(capsule => capsule.isLocked);
    const getUnlockedCapsules = () => capsules.filter(capsule => !capsule.isLocked);

    return {
        capsules,
        loading: isLoading,
        error,
        getLockedCapsules,
        getUnlockedCapsules,
    };
}

// Hook for gas estimation
/**
 * Hook to estimate gas cost for minting a capsule
 * @param {string} toAddress - Address to mint to
 * @param {string} publicMetadataUrl - Public metadata URL
 * @param {number} unlockTimestamp - Unlock timestamp
 * @param {string} encryptedPrivateMetadataHash - Encrypted private metadata hash
 * @param {boolean} enabled - Whether to run the estimation
 */
export function useGasEstimate(toAddress, publicMetadataUrl, unlockTimestamp, encryptedPrivateMetadataHash, enabled = true) {
    return useQuery({
        queryKey: ['gasEstimate', toAddress, publicMetadataUrl, unlockTimestamp, encryptedPrivateMetadataHash],
        queryFn: () => estimateMintGas(toAddress, publicMetadataUrl, unlockTimestamp, encryptedPrivateMetadataHash),
        enabled: enabled && !!toAddress && !!publicMetadataUrl && !!unlockTimestamp && !!encryptedPrivateMetadataHash,
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
        retry: 2,
        retryDelay: 1000,
    });
}
