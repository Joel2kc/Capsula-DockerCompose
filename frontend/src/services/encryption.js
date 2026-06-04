import { config } from '../config';



/**
 * Decrypt metadata hash using public blockchain data.
 * This can be used independently without backend dependency.
 */
export async function decryptMetadataHash(encryptedHash, unlockDate, creatorAddress, contractAddress) {
    // Check if unlocked
    if (new Date() < new Date(unlockDate)) {
        throw new Error("Capsule is still locked");
    }

    try {
        // Use backend decrypt endpoint (backend uses only public data for key derivation)
        const response = await fetch(`${config.api.url}/api/capsules/decrypt-metadata`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                encryptedHash,
                unlockDate,
                creatorAddress,
                contractAddress,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result.metadata_hash;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Decrypt metadata hash using contract address from config.
 * Convenience function that uses the app's contract address.
 */
export async function decryptMetadataHashWithContract(encryptedHash, unlockDate, creatorAddress) {
    return await decryptMetadataHash(
        encryptedHash,
        unlockDate,
        creatorAddress,
        config.hedera.capsulaAddress
    );
}
