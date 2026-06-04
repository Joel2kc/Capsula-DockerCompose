import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { fetchUserNFTs, fetchNFTMetadata } from "../services/hedera";

export function useNFTs() {
    const { address } = useAppKitAccount();
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadNFTs() {
            if (!address) {
                setNfts([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch NFTs using Mirror Node
                const userNfts = await fetchUserNFTs(address);

                // Fetch metadata for each NFT
                const nftsWithMetadata = await Promise.all(
                    userNfts.map(async (nft) => {
                        try {
                            const metadata = await fetchNFTMetadata(nft.metadata);
                            return {
                                ...nft,
                                ...metadata,
                                isLocked: new Date(metadata.unlockDate) > new Date(),
                            };
                        } catch (error) {
                            console.error(`Failed to fetch metadata for NFT ${nft.tokenId}:`, error);
                            return {
                                ...nft,
                                error: "Failed to load metadata",
                            };
                        }
                    })
                );

                setNfts(nftsWithMetadata);
            } catch (error) {
                console.error("Failed to load NFTs:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadNFTs();
    }, [address]);

    // Filter functions
    const getLockedNFTs = () => nfts.filter((nft) => nft.isLocked);
    const getUnlockedNFTs = () => nfts.filter((nft) => !nft.isLocked);

    return {
        nfts,
        loading,
        error,
        getLockedNFTs,
        getUnlockedNFTs,
    };
}