export default function UploadProgress({ step, status, hasMedia }) {
	const steps = hasMedia
		? [
				{ id: 1, name: "Uploading Media", description: "Storing your file on IPFS" },
				{ id: 2, name: "Creating Metadata", description: "Preparing your capsule data" },
				{ id: 3, name: "Minting NFT", description: "Creating your time-locked capsule" },
				{ id: 4, name: "Confirming", description: "Waiting for network confirmation" },
		  ]
		: [
				{ id: 1, name: "Creating Metadata", description: "Preparing your capsule data" },
				{ id: 2, name: "Minting NFT", description: "Creating your time-locked capsule" },
				{ id: 3, name: "Confirming", description: "Waiting for network confirmation" },
		  ];

	return (
		<div className="space-y-4">
			<div className="relative">
				{/* Progress Line */}
				<div className="absolute left-4 top-4 h-full w-0.5 -ml-px bg-primary-gold/20" aria-hidden="true" />

				{/* Steps */}
				<div className="relative space-y-6">
					{steps.map((s) => {
						const isCurrent = s.id === step;
						const isComplete = s.id < step;
						const isError = status === "error" && s.id === step;

						return (
							<div key={s.id} className="relative flex items-start group">
								{/* Step Indicator */}
								<span className="flex h-8 items-center" aria-hidden="true">
									<span
										className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full ${
											isError
												? "bg-red-500/20 ring-2 ring-red-500"
												: isComplete
												? "bg-primary-gold"
												: isCurrent
												? "bg-primary-gold/20 ring-2 ring-primary-gold"
												: "bg-primary-surface"
										}`}
									>
										{isComplete ? (
											<svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										) : isError ? (
											<svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
											</svg>
										) : isCurrent ? (
											<div className="w-4 h-4 border-2 border-primary-gold border-t-transparent rounded-full animate-spin" />
										) : (
											<div className="w-2.5 h-2.5 bg-primary-gold/20 rounded-full" />
										)}
									</span>
								</span>

								{/* Step Content */}
								<div className="ml-4 min-w-0">
									<div className="text-sm font-medium text-text-primary flex items-center gap-2">
										<span>{s.name}</span>
										{isError && <span className="text-red-400 text-xs">Failed</span>}
									</div>
									<div className="text-sm text-text-secondary">{s.description}</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
