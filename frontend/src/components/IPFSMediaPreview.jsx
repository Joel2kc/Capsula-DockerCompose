import { useState, useEffect } from "react";

export default function IPFSMediaPreview({ url, mediaType }) {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		if (!url) {
			setHasError(true);
			setIsLoading(false);
			return;
		}

		// Reset states when URL changes
		setIsLoading(true);
		setHasError(false);

		// Test if the URL is accessible
		const img = new Image();
		img.onload = () => {
			setIsLoading(false);
			setHasError(false);
		};
		img.onerror = () => {
			setIsLoading(false);
			setHasError(true);
		};
		img.src = url;
	}, [url]);

	const isImage = mediaType?.startsWith("image/") || url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
	const isVideo = mediaType?.startsWith("video/") || url?.match(/\.(mp4|webm|ogg|mov)$/i);

	if (hasError) {
		return (
			<div className="relative aspect-video bg-primary-surface/30 border border-primary-gold/20 rounded-lg flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
						<span className="text-red-500 text-xl">⚠️</span>
					</div>
					<p className="text-text-secondary text-sm">Media could not be loaded</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="relative aspect-video bg-primary-surface/30 border border-primary-gold/20 rounded-lg flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
						<span className="text-primary-gold text-lg">⏳</span>
					</div>
					<p className="text-text-secondary text-sm">Loading media...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative aspect-video bg-primary-surface/30 border border-primary-gold/20 rounded-lg overflow-hidden">
			{isImage ? (
				<img
					src={url}
					alt="Capsule media"
					className="absolute inset-0 w-full h-full object-contain"
					onLoad={() => setIsLoading(false)}
					onError={() => setHasError(true)}
				/>
			) : isVideo ? (
				<video
					src={url}
					controls
					className="absolute inset-0 w-full h-full object-contain"
					onLoadStart={() => setIsLoading(false)}
					onError={() => setHasError(true)}
				/>
			) : (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-center">
						<div className="w-12 h-12 rounded-full bg-primary-gold/10 flex items-center justify-center mx-auto mb-3">
							<span className="text-primary-gold text-xl">📄</span>
						</div>
						<p className="text-text-secondary text-sm">
							<a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-gold hover:underline">
								View File
							</a>
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
