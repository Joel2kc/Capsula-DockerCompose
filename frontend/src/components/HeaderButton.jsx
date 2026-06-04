import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import UserMenu from "./UserMenu";

export default function HeaderButton() {
	const { isConnected } = useAppKitAccount();
	const { open } = useAppKit();

	if (isConnected) {
		return <UserMenu />;
	}

	return (
		<button onClick={open} className="relative group z-20">
			{/* Button glow effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-primary-gold-light via-primary-gold to-primary-gold-light rounded-xl opacity-20 group-hover:opacity-30 blur-md transition-opacity duration-300 z-20" />

			{/* Button border */}
			<div className="absolute z-20 inset-0 rounded-xl border border-primary-gold/30 group-hover:border-primary-gold/50 transition-colors duration-300" />

			{/* Button content */}
			<div className="relative z-20 px-4 sm:px-6 py-2.5 text-sm sm:text-base text-primary-gold group-hover:text-primary-gold-light transition-colors duration-300 font-medium whitespace-nowrap">
				Connect Wallet
			</div>
		</button>
	);
}
