import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAppKitAccount } from "@reown/appkit/react";
import { useCapsulesWithMetadata } from "../hooks/useCapsula";
import CapsuleCard from "../components/CapsuleCard";
import { KeyIcon, HourglassIcon, XIcon, PackageIcon } from "../components/Icons";
import logo from "../assets/logo.png";

const FilterButton = ({ active, children, onClick }) => (
	<button
		onClick={onClick}
		className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
			active
				? "bg-primary-gold text-primary-black"
				: "text-text-secondary hover:text-primary-gold hover:bg-primary-gold/10"
		}`}
	>
		{children}
	</button>
);

export default function Gallery() {
	const [, setLocation] = useLocation();
	const { address, isConnected } = useAppKitAccount();
	const { capsules, loading, error, getLockedCapsules, getUnlockedCapsules } = useCapsulesWithMetadata(address);
	const [filter, setFilter] = useState("all"); // "all" | "locked" | "unlocked"

	const filteredCapsules =
		filter === "all" ? capsules : filter === "locked" ? getLockedCapsules() : getUnlockedCapsules();

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
					Connect your wallet to view your time capsules and create new ones.
				</p>
				<button onClick={() => setLocation("/")} className="btn-primary px-8 py-3">
					Back to Home
				</button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center text-3xl mb-6 animate-pulse">
					<HourglassIcon className="w-8 h-8 text-primary-gold" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Loading Your Capsules</h2>
				<p className="text-text-secondary text-center">Please wait while we fetch your time capsules...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
				<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
					<XIcon className="w-8 h-8 text-red-500" />
				</div>
				<h2 className="text-2xl font-display font-bold text-text-primary mb-4">Oops! Something went wrong</h2>
				<p className="text-text-secondary text-center max-w-md mb-8">{error?.message}</p>
				<button onClick={() => window.location.reload()} className="btn-primary px-8 py-3">
					Try Again
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
				<div>
					<h1 className="text-4xl font-display font-bold gradient-text mb-2">Your Capsules</h1>
					<p className="text-text-secondary">
						{capsules.length === 0
							? "You don't have any capsules yet. Mint your first message for tomorrow — today."
							: `You have ${capsules.length} capsule${capsules.length === 1 ? "" : "s"}.`}
					</p>
				</div>
				<button onClick={() => setLocation("/create")} className="btn-primary px-6 py-2 whitespace-nowrap">
					Create New Capsule
				</button>
			</div>

			{capsules.length > 0 && (
				<div className="flex items-center gap-2 mb-6">
					<FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
						All ({capsules.length})
					</FilterButton>
					<FilterButton active={filter === "locked"} onClick={() => setFilter("locked")}>
						Locked ({getLockedCapsules().length})
					</FilterButton>
					<FilterButton active={filter === "unlocked"} onClick={() => setFilter("unlocked")}>
						Unlocked ({getUnlockedCapsules().length})
					</FilterButton>
				</div>
			)}

			{capsules.length === 0 ? (
				<div className="min-h-[40vh] flex flex-col items-center justify-center">
					<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6">
						<PackageIcon className="w-8 h-8 text-primary-gold" />
					</div>
					<h2 className="text-2xl font-display font-bold text-text-primary mb-4">No Capsules Yet</h2>
					<p className="text-text-secondary text-center max-w-md mb-8">
						You don't have any capsules yet. Mint your first message for tomorrow — today.
					</p>
					<button onClick={() => setLocation("/create")} className="btn-primary px-8 py-3">
						Create Your Capsule
					</button>
				</div>
			) : (
				<AnimatePresence mode="popLayout">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{filteredCapsules.map((capsule) => (
							<CapsuleCard key={capsule.id} capsule={capsule} currentUserAddress={address} />
						))}
					</div>
				</AnimatePresence>
			)}
		</div>
	);
}
