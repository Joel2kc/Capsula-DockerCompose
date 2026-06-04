import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useModal } from "@reown/appkit/react";

export default function ConnectWallet() {
	const { address, isConnected } = useAccount();
	const { disconnect } = useDisconnect();
	const { openModal } = useModal();

	const handleClick = () => {
		if (isConnected) {
			disconnect();
		} else {
			openModal();
		}
	};

	return (
		<button onClick={handleClick} className="relative group">
			{/* Button glow effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-primary-gold-light via-primary-gold to-primary-gold-light rounded-xl opacity-20 group-hover:opacity-30 blur-md transition-opacity duration-300" />

			{/* Button border */}
			<div className="absolute inset-0 rounded-xl border border-primary-gold/30 group-hover:border-primary-gold/50 transition-colors duration-300" />

			{/* Button content */}
			<div className="relative px-4 sm:px-6 py-2.5 text-sm sm:text-base text-primary-gold group-hover:text-primary-gold-light transition-colors duration-300 font-medium whitespace-nowrap flex items-center gap-2">
				{isConnected ? (
					<>
						<div className="w-2 h-2 bg-primary-gold rounded-full animate-pulse" />
						{`${address.slice(0, 6)}...${address.slice(-4)}`}
					</>
				) : (
					"Connect Wallet"
				)}
			</div>
		</button>
	);
}
