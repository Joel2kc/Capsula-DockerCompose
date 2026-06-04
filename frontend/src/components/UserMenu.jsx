import { useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { useLocation } from "wouter";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { GiftIcon, UnlockIcon, SearchIcon } from "./Icons";

export default function UserMenu() {
	const [isOpen, setIsOpen] = useState(false);
	const { address } = useAccount();
	const { data: balance } = useBalance({ address });
	const { disconnect } = useDisconnect();
	const [, setLocation] = useLocation();

	if (!address) return null;

	return (
		<div className="relative">
			<button onClick={() => setIsOpen(!isOpen)} className="relative group z-20 flex items-center gap-2">
				{/* Button glow effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-primary-gold-light via-primary-gold to-primary-gold-light rounded-xl opacity-20 group-hover:opacity-30 blur-md transition-opacity duration-300 z-20" />

				{/* Button border */}
				<div className="absolute z-20 inset-0 rounded-xl border border-primary-gold/30 group-hover:border-primary-gold/50 transition-colors duration-300" />

				{/* Button content */}
				<div className="relative z-20 px-4 sm:px-6 py-2.5 text-sm sm:text-base text-primary-gold group-hover:text-primary-gold-light transition-colors duration-300 font-medium whitespace-nowrap flex items-center gap-2">
					<Jazzicon diameter={20} seed={jsNumberForAddress(address)} />
					<span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
				</div>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-72 sm:w-96 bg-primary-surface/95 backdrop-blur-lg rounded-xl border border-primary-gold/10 shadow-lg shadow-primary-gold/5 z-50">
					<div className="p-4">
						{/* Header */}
						<div className="flex items-center gap-3 mb-4 pb-4 border-b border-primary-gold/10">
							<Jazzicon diameter={40} seed={jsNumberForAddress(address)} />
							<div>
								<div className="text-text-primary font-medium">{`${address.slice(0, 6)}...${address.slice(-4)}`}</div>
								<div className="text-text-secondary text-sm">
									{balance?.formatted.slice(0, 7)} {balance?.symbol}
								</div>
							</div>
						</div>

						{/* Menu Items */}
						<div className="space-y-2">
							<button
								onClick={() => {
									setLocation("/gallery");
									setIsOpen(false);
								}}
								className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary-gold/10 text-text-primary transition-colors duration-200 flex items-center gap-2"
							>
								<GiftIcon className="w-4 h-4 text-primary-gold" />
								My Time Capsules
							</button>

							<button
								onClick={() => {
									window.open(`https://hashscan.io/mainnet/account/${address}`, "_blank");
								}}
								className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary-gold/10 text-text-primary transition-colors duration-200 flex items-center gap-2"
							>
								<SearchIcon className="w-4 h-4 text-primary-gold" />
								View on HashScan
							</button>

							<button
								onClick={() => {
									disconnect();
									setIsOpen(false);
								}}
								className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary-gold/10 text-text-primary transition-colors duration-200 flex items-center gap-2"
							>
								<UnlockIcon className="w-4 h-4 text-primary-gold" />
								Disconnect
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
