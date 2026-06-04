import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { LockIcon, CelebrationIcon, PaperclipIcon, ShareIcon, ExternalLinkIcon } from "./Icons";
import Toast from "./Toast";
import { getTokenOwner } from "../services/hedera";
import { config } from "../config";

function CountdownTimer({ unlockDate }) {
	const [timeLeft, setTimeLeft] = useState("");

	useEffect(() => {
		function updateTimer() {
			const now = new Date().getTime();
			const targetDate = new Date(unlockDate).getTime();
			const difference = targetDate - now;

			if (difference <= 0) {
				setTimeLeft("Unlocked!");
				return;
			}

			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);

			setTimeLeft(
				days > 0
					? `${days}d ${hours}h ${minutes}m`
					: hours > 0
					? `${hours}h ${minutes}m ${seconds}s`
					: `${minutes}m ${seconds}s`
			);
		}

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [unlockDate]);

	return (
		<div className="flex items-center gap-2 text-text-secondary">
			<div className="w-2 h-2 rounded-full bg-primary-gold animate-pulse" />
			{timeLeft}
		</div>
	);
}

export default function CapsuleCard({ capsule, currentUserAddress }) {
	const [, setLocation] = useLocation();
	const isLocked = capsule.isLocked || new Date(capsule.unlock_date) > new Date();
	const hasMedia = capsule.has_media && capsule.metadata?.hasMedia;
	const [currentOwner, setCurrentOwner] = useState(null);
	const [showToast, setShowToast] = useState(false);

	useEffect(() => {
		if (!currentUserAddress || !capsule.serial_number) return;
		async function fetchCurrentOwner() {
			const owner = await getTokenOwner(capsule.serial_number);
			setCurrentOwner(owner);
		}
		fetchCurrentOwner();
	}, [capsule.serial_number, currentUserAddress]);

	const isCurrentOwner = currentOwner && currentOwner.toLowerCase() === currentUserAddress.toLowerCase();

	const handleShare = async (e) => {
		e.stopPropagation(); // Prevent card click

		const shareUrl = `${window.location.origin}/capsule/${capsule.id}`;
		const shareText = `Check out this time-locked capsule on Capsula!`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: "Time-Locked Capsule",
					text: shareText,
					url: shareUrl,
				});
			} catch (error) {
				// User cancelled or error occurred
				console.log("Share cancelled or failed:", error);
			}
		} else {
			// Fallback: copy to clipboard
			try {
				await navigator.clipboard.writeText(shareUrl);
				setShowToast(true);
				setTimeout(() => setShowToast(false), 2000); // Hide after 2 seconds
			} catch (error) {
				console.error("Failed to copy to clipboard:", error);
			}
		}
	};

	const handleViewOnHashScan = (e) => {
		e.stopPropagation(); // Prevent card click

		// Construct HashScan URL for the specific NFT token
		const contractAddress = config.hedera.capsulaAddress;
		const network = config.hedera.network;
		const tokenId = capsule.serial_number;

		// Use appropriate HashScan URL based on network
		const baseUrl = network === "mainnet" ? "https://hashscan.io/mainnet" : "https://hashscan.io/testnet";
		const hashScanUrl = `${baseUrl}/contract/${contractAddress}?tid=${tokenId}`;

		window.open(hashScanUrl, "_blank", "noopener,noreferrer");
	};

	return (
		<>
			<div className="group relative bg-primary-surface/30 border border-primary-gold/10 rounded-xl overflow-hidden hover:border-primary-gold/30 transition-all duration-300">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

				{/* Action Buttons */}
				<div className="absolute top-3 left-3 z-20 flex gap-2">
					{/* Share Button */}
					<button
						onClick={handleShare}
						className="p-2 rounded-full bg-primary-surface/80 backdrop-blur-sm border border-primary-gold/20 hover:bg-primary-gold/20 hover:border-primary-gold/40 transition-all duration-200 group"
						title="Share capsule"
					>
						<ShareIcon className="w-4 h-4 text-primary-gold group-hover:text-primary-gold" />
					</button>

					{/* HashScan Button */}
					<button
						onClick={handleViewOnHashScan}
						className="p-2 rounded-full bg-primary-surface/80 backdrop-blur-sm border border-primary-gold/20 hover:bg-primary-gold/20 hover:border-primary-gold/40 transition-all duration-200 group"
						title="View on HashScan"
					>
						<ExternalLinkIcon className="w-4 h-4 text-primary-gold group-hover:text-primary-gold" />
					</button>
				</div>

				<button onClick={() => setLocation(`/capsule/${capsule.id}`)} className="block w-full text-left">
					<div className="relative aspect-square">
						{isLocked ? (
							<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
								<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-4">
									<LockIcon className="w-8 h-8 text-primary-gold" />
								</div>
								<p className="text-text-primary font-medium mb-2">
									Locked — Unlocks on {new Date(capsule.unlock_date).toLocaleDateString()}
								</p>
								<CountdownTimer unlockDate={capsule.unlock_date} />
							</div>
						) : (
							<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
								<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
									<CelebrationIcon className="w-8 h-8 text-green-500" />
								</div>
								<p className="text-text-primary font-medium mb-2">Unlocked — Open Your Message</p>
								{hasMedia && <PaperclipIcon className="w-6 h-6 text-text-secondary mt-2" />}
							</div>
						)}
					</div>

					<div className="  right-0 px-4 pb-2">
						{/* Owner Indicator */}
						{!!currentUserAddress && !!currentOwner && (
							<div className="mb-2">
								{isCurrentOwner ? (
									<div className="inline-flex items-center px-2 py-1 rounded-full bg-primary-gold/20 text-primary-gold text-xs font-medium">
										<span className="w-1.5 h-1.5 bg-primary-gold rounded-full mr-1.5" />
										You Own This
									</div>
								) : (
									<div className="inline-flex items-center px-1 py-0.5 rounded-full bg-red-500/15 text-red-400/80 text-[10px] font-medium absolute top-2 right-2 z-10">
										<span className="w-0.5 h-0.5 bg-red-400 rounded-full mr-1" />
										Not yours anymore
									</div>
								)}
							</div>
						)}

						<div className="flex items-center justify-between">
							<div>
								<p className="text-text-primary font-medium mb-1">{isLocked ? "Unlocks" : "Unlocked"}</p>
								<p className="text-text-secondary text-sm">
									{new Date(capsule.unlock_date).toLocaleDateString(undefined, {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</div>
							<div
								className={`w-2 h-2 rounded-full ${isLocked ? "bg-primary-gold" : "bg-green-500"} ${
									isLocked ? "animate-pulse" : ""
								}`}
							/>
						</div>
					</div>
				</button>
			</div>

			<Toast message="Link copied to clipboard!" isVisible={showToast} onClose={() => setShowToast(false)} />
		</>
	);
}
