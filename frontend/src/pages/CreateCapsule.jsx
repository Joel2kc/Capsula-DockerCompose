import { useState, useRef } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";
import { useLocation } from "wouter";
import { useAppKitAccount } from "@reown/appkit/react";
import { capsuleSchema } from "../schemas/capsule";
import { useUploadCapsule, useTrackCapsule, useGasEstimate } from "../hooks/useCapsula";
import { useMintNFT } from "../services/hedera";
import MarkdownToolbar from "../components/MarkdownToolbar";
import FilePreview from "../components/FilePreview";
import Modal from "../components/Modal";
import UploadProgress from "../components/UploadProgress";
import DateTimePicker from "../components/DateTimePicker";
import { KeyIcon, UnlockIcon, CelebrationIcon } from "../components/Icons";
import logo from "../assets/logo.png";

const MAX_CHARS = 5000;

export default function CreateCapsule() {
	const [preview, setPreview] = useState(false);
	const [uploadStep, setUploadStep] = useState(0);
	const [uploadStatus, setUploadStatus] = useState("idle"); // idle | running | error | success
	const [uploadError, setUploadError] = useState(null);
	const [pendingMint, setPendingMint] = useState(false);
	const [mintContext, setMintContext] = useState(null); // { hasMedia, address, metadataHash }
	const [, setLocation] = useLocation();
	const { address, isConnected } = useAppKitAccount();
	const messageRef = useRef(null);
	const idRef = useRef(null);

	const { mutateAsync: uploadCapsule } = useUploadCapsule();
	const { mutateAsync: trackCapsule } = useTrackCapsule();
	const mintHook = useMintNFT();

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
	} = useForm({
		resolver: zodResolver(capsuleSchema),
		defaultValues: {
			message: "",
			unlockDate: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
			file: undefined,
		},
	});

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		maxFiles: 1,
		accept: {
			"image/*": [".jpeg", ".jpg", ".png", ".gif"],
			"video/*": [".mp4"],
		},
		onDrop: (acceptedFiles) => {
			setValue("file", acceptedFiles[0]);
		},
	});

	const message = watch("message");
	const unlockDate = watch("unlockDate");
	const file = watch("file");

	// Use gas estimation hook
	const mockMetadataUrl = "https://ipfs.io/ipfs/mock-hash-for-estimation";
	const mockEncryptedHash = "mock-encrypted-hash-for-estimation";
	const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);

	const { data: gasEstimateData, isLoading: isEstimatingGas } = useGasEstimate(
		address,
		mockMetadataUrl,
		unlockTimestamp,
		mockEncryptedHash,
		isConnected && !!address && !!message.trim()
	);

	const onSubmit = async (data) => {
		if (!isConnected) {
			setUploadError("Please connect your wallet first");
			return;
		}

		const hasMedia = Boolean(data.file);

		try {
			setUploadError(null);
			setUploadStatus("running");
			// Initial step depends on whether media exists
			setUploadStep(1);

			// Upload to backend (handles IPFS)
			const { metadata_hash, private_metadata_hash, id } = await uploadCapsule({
				file: data.file,
				message: data.message,
				unlockDate: data.unlockDate,
				address,
			});

			idRef.current = id;

			// After metadata
			setUploadStep(hasMedia ? 2 : 1);

			// Mint NFT via contract hook
			// Minting step
			setUploadStep(hasMedia ? 3 : 2);
			await mintHook.mint({
				toAddress: address,
				publicMetadataUrl: `https://ipfs.io/ipfs/${metadata_hash}`,
				unlockTimestamp: Math.floor(unlockDate.getTime() / 1000),
				encryptedPrivateMetadataHash: private_metadata_hash,
			});
			// Defer follow-up to hook effects
			setPendingMint(true);
			setMintContext({ hasMedia, address, metadataHash: metadata_hash });
		} catch (error) {
			console.error("Failed to create capsule:", error);
			setUploadError(error.message || "Something went wrong");
			setUploadStatus("error");
		}
	};

	// React to mint hook status and complete the flow without manual polling
	useEffect(() => {
		if (!pendingMint) return;
		if (mintHook.status === "error") {
			setUploadError(mintHook.error?.message || "Mint failed");
			setUploadStatus("error");
			setPendingMint(false);
			return;
		}
		if (mintHook.isConfirming) {
			// already on mint step
			return;
		}
		if (mintHook.isSuccess && mintHook.result && mintContext) {
			const { hasMedia, address } = mintContext;
			const { tokenId, serialNumber } = mintHook.result;
			// Confirm step
			setUploadStep(hasMedia ? 4 : 3);
			setUploadStatus("success");
			// Track and navigate
			(async () => {
				try {
					await trackCapsule({ tokenId, serialNumber, address });
				} catch (e) {
					console.error("trackCapsule failed", e);
				}
				setTimeout(() => setLocation(`/capsule/${idRef.current}`), 2000);
			})();
			setPendingMint(false);
		}
	}, [
		pendingMint,
		mintHook.status,
		mintHook.isConfirming,
		mintHook.isSuccess,
		mintHook.result,
		mintHook.error,
		mintContext,
		trackCapsule,
		setLocation,
	]);

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
				<p className="text-text-secondary text-center max-w-md mb-8">
					Connect your wallet to create time capsules and preserve your memories.
				</p>
				<button onClick={() => setLocation("/")} className="btn-primary px-8 py-3">
					Back to Home
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-4xl font-display font-bold mb-4 gradient-text">Create Your Capsule</h1>
				<p className="text-text-secondary">
					Write a message, upload a memory, and choose when it should be revealed. Your capsule will be minted as a
					unique NFT on Hedera blockchain and locked until your chosen date.
				</p>
				<div className="flex items-center justify-center mt-6 gap-2">
					<span className="text-text-secondary text-sm">Secured by</span>
					<img src="/hedera-logo-placeholder.jpg" alt="Hedera" className="h-5 w-auto" />
					<span className="text-text-secondary text-sm">blockchain</span>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Message Input */}
				<div>
					<label className="block text-sm font-medium text-text-primary mb-2">Your Message or Media</label>
					<MarkdownToolbar textareaRef={messageRef} />
					<div className="relative">
						<textarea
							{...register("message")}
							ref={(e) => {
								register("message").ref(e);
								messageRef.current = e;
							}}
							className="w-full h-48 bg-primary-surface/30 border border-primary-gold/20 rounded-xl p-4 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary-gold/40 transition-colors"
							placeholder="Write your message here... Markdown is supported"
						/>
						<div className="absolute bottom-2 right-2 text-sm text-text-secondary">
							{message.length} / {MAX_CHARS}
						</div>
						{errors.message && <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>}
					</div>
				</div>

				{/* File Upload */}
				<div>
					<label className="block text-sm font-medium text-text-primary mb-2">Media (Optional)</label>
					{file ? (
						<div className="mb-4 max-w-xs">
							<FilePreview file={file} onRemove={() => setValue("file", undefined)} />
						</div>
					) : (
						<div
							{...getRootProps()}
							className="border-2 border-dashed border-primary-gold/20 rounded-xl p-8 text-center hover:border-primary-gold/40 transition-colors cursor-pointer"
						>
							<input {...getInputProps()} />
							{isDragActive ? (
								<p className="text-text-secondary">Drop your file here...</p>
							) : (
								<p className="text-text-secondary">Drag & drop or click to select a file (max 50MB)</p>
							)}
						</div>
					)}
					{errors.file && <p className="mt-1 text-sm text-red-500">{errors.file.message}</p>}
				</div>

				{/* Unlock Date */}
				<div>
					<label className="block text-sm font-medium text-text-primary mb-2">Unlock Date</label>
					<DateTimePicker
						selected={unlockDate}
						onChange={(date) => setValue("unlockDate", date)}
						minDate={new Date(Date.now() + 2 * 60 * 1000)} // Minimum 2 minutes from now
					/>
					{errors.unlockDate && <p className="mt-1 text-sm text-red-500">{errors.unlockDate.message}</p>}
				</div>

				{/* Gas Estimate */}
				<div className="bg-primary-surface/30 rounded-lg p-3 sm:p-4 border border-primary-gold/10">
					<h3 className="text-sm font-medium text-text-primary mb-3">Estimated Cost</h3>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="text-text-secondary">
							<div className="flex items-center gap-2">
								<span className="text-sm sm:text-base">Gas:</span>
								{isEstimatingGas ? (
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 border border-primary-gold/50 border-t-primary-gold rounded-full animate-spin"></div>
										<span className="text-xs sm:text-sm">Estimating...</span>
									</div>
								) : (
									gasEstimateData &&
									gasEstimateData?.gasLimit && (
										<span className="font-medium text-primary-gold text-sm sm:text-base">
											{Number(gasEstimateData.gasLimit).toLocaleString()} units
										</span>
									)
								)}
							</div>
						</div>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
							<button
								type="button"
								onClick={() => setPreview(true)}
								className="btn-outline px-4 sm:px-6 py-2 text-sm sm:text-base flex-1 sm:flex-none"
							>
								Preview
							</button>
							<button
								type="submit"
								disabled={uploadStep > 0 || !isConnected}
								className="btn-primary px-4 sm:px-8 py-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
							>
								{!isConnected ? "Connect Wallet" : uploadStep > 0 ? "Creating..." : "Mint Capsule"}
							</button>
						</div>
					</div>
				</div>
			</form>

			{/* Preview Modal */}
			<Modal isOpen={preview} onClose={() => setPreview(false)}>
				{/* Preview Header - Fixed */}
				<div className="sticky top-0 z-10 bg-primary-surface/95 backdrop-blur-xl p-4 border-b border-primary-gold/10 flex items-center justify-between">
					<h3 className="text-lg font-medium text-text-primary">Capsule Preview</h3>
				</div>

				{/* Preview Content - Scrollable */}
				<div className="flex-1 overflow-y-auto">
					<div className="p-6">
						{/* Message */}
						<div className="prose prose-invert prose-gold max-w-none">
							<ReactMarkdown>{message || "*No message yet*"}</ReactMarkdown>
						</div>

						{/* Media */}
						{file && (
							<div className="mt-6 border-t border-primary-gold/10 pt-6">
								<h4 className="text-sm font-medium text-text-secondary mb-3">Attached Media</h4>
								<FilePreview file={file} onRemove={() => setValue("file", undefined)} />
							</div>
						)}

						{/* Unlock Info */}
						<div className="mt-6 border-t border-primary-gold/10 pt-6">
							<h4 className="text-sm font-medium text-text-secondary mb-2">Unlock Details</h4>
							<div className="bg-primary-surface/50 rounded-lg p-4">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-primary-gold/10 flex items-center justify-center text-2xl">
										<UnlockIcon className="w-6 h-6 text-primary-gold" />
									</div>
									<div>
										<p className="text-text-primary font-medium">
											Unlocks{" "}
											{unlockDate.toLocaleDateString(undefined, {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</p>
										<p className="text-text-secondary">
											at{" "}
											{unlockDate.toLocaleTimeString(undefined, {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal Footer - Fixed */}
				<div className="sticky bottom-0 z-10 bg-primary-surface/95 backdrop-blur-xl border-t border-primary-gold/10 p-4 flex justify-end">
					<button type="button" onClick={() => setPreview(false)} className="btn-outline px-6 py-2">
						Close Preview
					</button>
				</div>
			</Modal>

			{/* Upload Progress Modal */}
			<Modal isOpen={uploadStep > 0 || uploadStatus === "error"} onClose={() => {}}>
				<div className="p-6">
					<h3 className="text-lg font-medium text-text-primary mb-6">Creating Your Time Capsule</h3>
					<UploadProgress
						step={uploadStep}
						status={mintHook.status === "error" ? "error" : uploadStatus}
						hasMedia={!!file}
					/>
					{uploadError && (
						<div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
							<p className="text-red-500">{uploadError}</p>
							<div className="mt-4 flex items-center gap-3 justify-end">
								<button
									onClick={() => {
										setUploadError(null);
										setUploadStatus("idle");
										setUploadStep(0);
									}}
									className="btn-outline px-4 py-2"
								>
									Close
								</button>
								<button onClick={() => handleSubmit(onSubmit)()} className="btn-primary px-4 py-2">
									Retry
								</button>
							</div>
						</div>
					)}
					{uploadStatus === "success" && uploadStep === (file ? 4 : 3) && (
						<div className="mt-6">
							<div className="text-center mb-6">
								<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 mx-auto">
									<CelebrationIcon className="w-8 h-8 text-green-500" />
								</div>
								<h3 className="text-xl font-display font-bold text-text-primary mb-2">Capsule Minted!</h3>
								<p className="text-text-secondary">
									Your message is locked until {unlockDate.toLocaleDateString()}. Share this capsule or transfer it to
									someone you want to receive it.
								</p>
							</div>
							<div className="flex justify-end">
								<button onClick={() => window.location.reload()} className="btn-primary px-6 py-2">
									Done
								</button>
							</div>
						</div>
					)}
				</div>
			</Modal>
		</div>
	);
}
