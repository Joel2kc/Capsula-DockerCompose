import { config } from "../config";

const API_URL = config.api.url;

async function handleResponse(response) {
    if (!response.ok) {
        let errorMessage;
        try {
            const data = await response.json();
            errorMessage = data.detail || "Something went wrong";
        } catch {
            errorMessage = "Failed to connect to server";
        }
        throw new Error(errorMessage);
    }

    try {
        return await response.json();
    } catch {
        throw new Error("Invalid response from server");
    }
}

export async function uploadToBackend({ file, message, unlockDate, address }) {
    if (!API_URL) {
        throw new Error("API URL is not configured");
    }

    try {
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

        return handleResponse(response);
    } catch (error) {
        console.error("Failed to upload to backend:", error);
        if (error.message === "Failed to fetch") {
            throw new Error("Could not connect to server. Please check your connection and try again.");
        }
        throw error;
    }
}

export async function getCapsuleMetrics(address) {
    if (!API_URL || !address) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/capsules/metrics/${address}`);
        return handleResponse(response);
    } catch (error) {
        console.error("Failed to fetch capsule metrics:", error);
        return null;
    }
}

export async function trackCapsuleCreation({ tokenId, serialNumber, address }) {
    if (!API_URL || !tokenId || !serialNumber || !address) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/capsules/track`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token_id: tokenId,
                serial_number: serialNumber,
                creator_address: address,
            }),
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Failed to track capsule creation:", error);
        // Don't throw error as this is non-critical
        return null;
    }
}