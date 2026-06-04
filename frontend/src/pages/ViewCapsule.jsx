import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useAppKitAccount } from "@reown/appkit/react";
import { fetchNFTMetadata, getPrivateMetadataHash, getCapsuleInfo } from "../services/hedera";
import { useCapsuleById } from "../hooks/useCapsula";
import { decryptMetadataHashWithContract } from "../services/encryption";
import ReactMarkdown from "react-markdown";
import IPFSMediaPreview from "../components/IPFSMediaPreview";
import {
	LockIcon,
	KeyIcon,
	HourglassIcon,
	XIcon,
	PackageIcon,
	UnlockIcon,
	DocumentIcon,
	EyeIcon,
} from "../components/Icons";
import logo from "../assets/logo.png";

function MessageContent({ metadata, showMessage, setShowMessage }) {
	console.log("📸 MessageContent metadata:", metadata);
	console.log("📸 Available media fields:", {
		mediaUrl: metadata?.mediaUrl,
		mediaType: metadata?.mediaType,
		hasMedia: metadata?.hasMedia,
		mediaIpfsHash: metadata?.mediaIpfsHash,
	});

	// Check if there's any content to show
	const hasContent = metadata?.message || metadata?.mediaUrl || metadata?.mediaIpfsHash;

	return (
		<div className="space-y-6">
			{/* Toggle Button - Always visible if there's content */}
			{hasContent && (
				<div className="flex items-center justify-between">
					<h3 className="text-xl font-display font-semibold text-text-primary">Private Content</h3>
					<button
						onClick={() => setShowMessage(!showMessage)}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-primary-gold/10 hover:bg-primary-gold/20 text-primary-gold"
					>
						<EyeIcon className="w-4 h-4" />
						{showMessage ? "Hide" : "Show"} Content
					</button>
				</div>
			)}

			{/* Content Section - Show/hide both message and media */}
			{hasContent ? (
				showMessage ? (
					<div className="space-y-6">
						{/* Media Section */}
						{(metadata?.mediaUrl || metadata?.mediaIpfsHash) && (
							<IPFSMediaPreview url={metadata.mediaUrl || metadata.mediaIpfsHash} mediaType={metadata?.mediaType} />
						)}

						{/* Message Section */}
						{metadata?.message && (
							<div className="prose prose-invert prose-lg max-w-none">
								<ReactMarkdown>{metadata.message.replace(/\r\n/g, "\n")}</ReactMarkdown>
							</div>
						)}
					</div>
				) : (
					<div className="bg-primary-surface/30 border border-primary-gold/20 rounded-lg p-8 text-center">
						<div className="w-12 h-12 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-4">
							<EyeIcon className="w-6 h-6 text-primary-gold" />
						</div>
						<p className="text-text-secondary">Content is hidden for privacy. Click "Show Content" to reveal.</p>
					</div>
				)
			) : (
				<div className="text-center py-12">
					<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-4">
						<DocumentIcon className="w-8 h-8 text-primary-gold" />
					</div>
					<p className="text-text-secondary">This capsule contains no content.</p>
				</div>
			)}
		</div>
	);
}

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
		<div className="text-center">
			<div className="w-24 h-24 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-6">
				<LockIcon className="w-12 h-12 text-primary-gold" />
			</div>
			<h2 className="text-3xl font-display font-bold text-text-primary mb-4">Time-Locked Capsule</h2>
			<div className="flex items-center justify-center gap-3 text-xl text-text-secondary mb-6">
				<div className="w-3 h-3 rounded-full bg-primary-gold animate-pulse" />
				<span>Unlocks in {timeLeft}</span>
			</div>
			<p className="text-text-secondary">
				This capsule will unlock on{" "}
				<span className="text-primary-gold font-medium">
					{new Date(unlockDate).toLocaleDateString(undefined, {
						year: "numeric",
						month: "long",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			</p>
		</div>
	);
}

export default function ViewCapsule() {
	const [, params] = useRoute("/capsule/:id");
	const { address, isConnected } = useAppKitAccount();
	const capsuleId = params?.id;

	// Extract the MongoDB ObjectId from the capsule URL
	// The capsule ID in the URL should be the MongoDB ObjectId, not tokenId-serialNumber
	const { data: capsule, isLoading: backendLoading, error: backendError } = useCapsuleById(address, capsuleId);
	const [metadata, setMetadata] = useState(null);
	const [metadataLoading, setMetadataLoading] = useState(false);
	const [userOwnsNFT, setUserOwnsNFT] = useState(false);
	const [showMessage, setShowMessage] = useState(false);

	useEffect(() => {
		async function loadMetadata() {
			console.log("🔍 ViewCapsule useEffect triggered");
			console.log("📦 Capsule data:", {
				hasCapsule: !!capsule,
				token_id: capsule?.token_id,
				serial_number: capsule?.serial_number,
				is_unlocked: capsule?.is_unlocked,
			});

			if (!capsule?.token_id || !capsule?.serial_number) {
				console.log("❌ Early return - missing token data");
				return;
			}

			try {
				console.log("🔄 Starting metadata loading process");
				setMetadataLoading(true);

				// First get capsule info from contract
				console.log("📋 Getting capsule info from contract...");
				const capsuleInfo = await getCapsuleInfo(capsule.serial_number);
				console.log("✅ Capsule info:", capsuleInfo);

				// Check if user owns this NFT
				const ownsNFT = capsuleInfo.owner.toLowerCase() === address.toLowerCase();

				console.log("capsuleInfo.owner", capsuleInfo.owner);
				console.log("address", address);
				console.log("ownsNFT", ownsNFT);
				setUserOwnsNFT(ownsNFT);

				if (!ownsNFT) {
					console.log("❌ User doesn't own this NFT");
					// Don't throw error, just return early - user can still see capsule info
					return;
				}

				// Check if capsule is unlocked
				if (!capsuleInfo.isUnlocked) {
					console.log("❌ Capsule is still locked");
					return;
				}

				// Get private metadata hash from contract
				console.log("🔐 Getting private metadata hash from contract...");
				const encryptedPrivateHash = await getPrivateMetadataHash(capsule.serial_number, address);
				console.log("✅ Encrypted private hash:", encryptedPrivateHash);

				// Decrypt the private metadata hash using frontend encryption
				console.log("🔓 Decrypting private metadata hash...");
				console.log("🔐 Decrypt parameters:", {
					encryptedHash: encryptedPrivateHash.substring(0, 50) + "...",
					unlockDate: capsule.unlock_date,
					creatorAddress: capsule.creator_address,
				});

				const metadata_hash = await decryptMetadataHashWithContract(
					encryptedPrivateHash,
					capsule.unlock_date,
					capsule.creator_address
				);
				console.log("✅ Decrypted metadata hash:", metadata_hash);
				console.log("📝 Decrypted metadata hash:", metadata_hash);

				// Fetch the private metadata from IPFS
				console.log("🌐 Fetching private metadata from IPFS...");
				const ipfsUrl = `https://ipfs.io/ipfs/${metadata_hash}`;
				console.log("🌐 IPFS URL:", ipfsUrl);

				const privateMetadata = await fetchNFTMetadata(ipfsUrl);
				console.log("✅ Private metadata fetched:", privateMetadata);
				console.log("📝 Available metadata fields:", Object.keys(privateMetadata));
				console.log("💬 Message content:", privateMetadata.message?.substring(0, 100) + "...");

				setMetadata(privateMetadata);
				console.log("✅ Metadata state updated");
			} catch (metaError) {
				console.error("❌ Failed to load private metadata:", metaError);
				console.error("❌ Error details:", {
					message: metaError.message,
					stack: metaError.stack,
					name: metaError.name,
				});
			} finally {
				console.log("🏁 Metadata loading finished");
				setMetadataLoading(false);
			}
		}

		if (address && capsule) {
			loadMetadata();
		}
	}, [
		capsule?.token_id,
		capsule?.serial_number,
		capsule?.is_unlocked,
		capsule?.unlock_date,
		capsule?.creator_address,
		capsule,
		address,
	]);

	const loading = backendLoading || metadataLoading;
	const error = backendError;

	if (!isConnected) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6">
					<KeyIcon className="w-8 h-8 text-primary-gold" />
				</div>
				<div className="flex items-center justify-center mb-4">
					<img src={logo} alt="Capsula" className="h-6 w-auto" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Connect Your Wallet</h2>
				<p className="text-text-secondary text-center max-w-md mb-8">Connect your wallet to view this time capsule.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 animate-pulse">
					<HourglassIcon className="w-8 h-8 text-primary-gold" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Loading Capsule</h2>
				<p className="text-text-secondary text-center">Please wait while we fetch your time capsule...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
					<XIcon className="w-8 h-8 text-red-500" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Error Loading Capsule</h2>
				<p className="text-text-secondary text-center max-w-md mb-8">{error.message}</p>
			</div>
		);
	}

	if (!capsuleId) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
					<XIcon className="w-8 h-8 text-red-500" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Invalid Capsule ID</h2>
				<p className="text-text-secondary text-center max-w-md mb-8">The capsule ID is missing.</p>
			</div>
		);
	}

	if (!loading && !capsule) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6">
					<PackageIcon className="w-8 h-8 text-primary-gold" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Capsule Not Found</h2>
				<p className="text-text-secondary text-center max-w-md mb-8">
					This capsule doesn't exist or you don't have permission to view it.
				</p>
			</div>
		);
	}

	const isLocked = !capsule.is_unlocked;

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="bg-primary-surface/30 border border-primary-gold/20 rounded-2xl overflow-hidden">
				{/* Header */}
				<div className="p-6 border-b border-primary-gold/10">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-display font-bold gradient-text mb-2">
								{!userOwnsNFT ? "Someone Else's Capsule" : isLocked ? "Time-Locked Capsule" : "Unlocked Capsule"}
							</h1>
							<p className="text-text-secondary">
								Created on{" "}
								{new Date(capsule.created_at).toLocaleDateString(undefined, {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
						<div
							className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
								!userOwnsNFT
									? "bg-red-500/20 text-red-400"
									: isLocked
									? "bg-primary-gold/20 text-primary-gold"
									: "bg-green-500/20 text-green-400"
							}`}
						>
							{!userOwnsNFT ? (
								<>
									<KeyIcon className="w-4 h-4" />
									Not Yours
								</>
							) : isLocked ? (
								<>
									<LockIcon className="w-4 h-4" />
									Locked
								</>
							) : (
								<>
									<UnlockIcon className="w-4 h-4" />
									Unlocked
								</>
							)}
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="p-8">
					{!userOwnsNFT ? (
						<div className="text-center">
							<div className="w-24 h-24 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-6">
								<KeyIcon className="w-12 h-12 text-primary-gold" />
							</div>
							<h2 className="text-3xl font-display font-bold text-text-primary mb-4">You Don't Own This NFT</h2>
							<p className="text-text-secondary max-w-md mx-auto mb-6">
								This capsule belongs to someone else. You can view basic information about it, but you cannot access the
								private content.
							</p>
							{isLocked ? (
								<div className="text-center">
									<div className="w-3 h-3 rounded-full bg-primary-gold animate-pulse mx-auto mb-2" />
									<p className="text-text-secondary">
										Unlocks on{" "}
										<span className="text-primary-gold font-medium">
											{new Date(capsule.unlock_date).toLocaleDateString(undefined, {
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</p>
								</div>
							) : (
								<div className="text-center">
									<div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mx-auto mb-2" />
									<p className="text-green-400 font-medium">This capsule has been unlocked</p>
								</div>
							)}
						</div>
					) : isLocked ? (
						<CountdownTimer unlockDate={capsule.unlock_date} />
					) : (
						<div>
							{metadata ? (
								<MessageContent metadata={metadata} showMessage={showMessage} setShowMessage={setShowMessage} />
							) : (
								<div className="text-center py-12">
									<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-4">
										<DocumentIcon className="w-8 h-8 text-primary-gold" />
									</div>
									<p className="text-text-secondary">
										This capsule contains a message, but the content is currently unavailable.
									</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-primary-gold/10 bg-primary-surface/10">
					<div className="flex items-center justify-center text-sm text-text-secondary">
						<div>
							<span className="text-primary-gold">Unlock Date:</span>{" "}
							{new Date(capsule.unlock_date).toLocaleDateString(undefined, {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
