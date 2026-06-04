const FileIcon = ({ type }) => {
	const getIcon = () => {
		if (type.startsWith("image/")) return "🖼️";
		if (type.startsWith("video/")) return "🎥";
		return "📄";
	};

	return (
		<div className="w-8 h-8 rounded-full bg-primary-gold/10 flex items-center justify-center text-lg">{getIcon()}</div>
	);
};

export default function FilePreview({ file, onRemove }) {
	if (!file) return null;

	const isImage = file.type.startsWith("image/");
	const isVideo = file.type.startsWith("video/");
	const fileUrl = URL.createObjectURL(file);

	return (
		<div className="relative group">
			{/* Remove button */}
			<div className="absolute -top-2 -right-2 z-10">
				<button
					onClick={onRemove}
					className="w-6 h-6 rounded-full bg-primary-surface border border-primary-gold/20 text-text-secondary hover:text-primary-gold transition-colors flex items-center justify-center"
				>
					✕
				</button>
			</div>

			{/* Preview card */}
			<div className="relative rounded-lg overflow-hidden bg-primary-surface/30 border border-primary-gold/10 group-hover:border-primary-gold/30 transition-colors">
				{/* Media preview */}
				<div className="relative aspect-video bg-black/20">
					{isImage && <img src={fileUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />}
					{isVideo && <video src={fileUrl} controls className="absolute inset-0 w-full h-full object-contain" />}
					{!isImage && !isVideo && (
						<div className="absolute inset-0 flex items-center justify-center">
							<FileIcon type={file.type} />
						</div>
					)}
				</div>

				{/* File info */}
				<div className="bg-primary-surface/80 backdrop-blur-sm px-4 py-3">
					<div className="flex items-center gap-3">
						<FileIcon type={file.type} />
						<div className="flex-1 min-w-0">
							<p className="text-text-primary truncate font-medium">{file.name}</p>
							<p className="text-text-secondary text-sm flex items-center gap-2">
								<span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
								<span>•</span>
								<span>{file.type.split("/")[1].toUpperCase()}</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
