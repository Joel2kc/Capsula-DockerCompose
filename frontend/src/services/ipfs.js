import { create } from "ipfs-http-client";
import { config } from "../config";

// Create an IPFS client using Infura
const auth = "Basic " + btoa(config.ipfs.projectId + ":" + config.ipfs.projectSecret);

const client = create({
    host: new URL(config.ipfs.gateway).hostname,
    port: 5001,
    protocol: "https",
    headers: {
        authorization: auth,
    },
});

export async function uploadToIPFS({ file, message, unlockDate }) {
    try {
        // Upload the file if provided
        let mediaIpfsUrl = null;
        if (file) {
            // Create a buffer from the file
            const buffer = await file.arrayBuffer();
            const { path: cid } = await client.add(buffer);
            mediaIpfsUrl = `ipfs://${cid}`;
        }

        // Create metadata
        const metadata = {
            name: `Capsula #${Date.now()}`,
            description: message,
            unlockDate: unlockDate.toISOString(),
            type: file?.type || "text/plain",
            media: mediaIpfsUrl,
            properties: {
                type: "time-locked-nft",
                version: "1.0.0",
            },
        };

        // Upload metadata
        const { path: metadataCid } = await client.add(JSON.stringify(metadata));

        return {
            mediaUrl: mediaIpfsUrl,
            metadataUrl: `ipfs://${metadataCid}`,
        };
    } catch (error) {
        console.error("Failed to upload to IPFS:", error);
        throw new Error("Failed to upload to IPFS. Please try again.");
    }
}
