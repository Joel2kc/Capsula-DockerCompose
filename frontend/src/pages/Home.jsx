import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";
import ParticleBackground from "../components/ParticleBackground";
import { NumberIcon, ClockIcon, LinkIcon, GiftIcon, InfinityIcon } from "../components/Icons";
import logo from "../assets/logo.png";

const fadeUpScale = {
	initial: { opacity: 0, y: 40, scale: 0.95 },
	animate: { opacity: 1, y: 0, scale: 1 },
	transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
	initial: { opacity: 0 },
	animate: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.1,
		},
	},
};

const SampleCapsule = ({ days, title }) => (
	<motion.div
		className="group relative bg-primary-surface/30 backdrop-blur-sm p-8 rounded-2xl overflow-hidden"
		whileHover={{ scale: 1.02 }}
		whileTap={{ scale: 0.98 }}
	>
		{/* Glow effects */}
		<div className="absolute inset-0 bg-gradient-radial from-primary-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
		<div className="absolute -inset-1 bg-gradient-to-r from-primary-gold/20 to-primary-gold/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

		{/* Noise texture */}
		<div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-soft-light" />

		{/* Border */}
		<div className="absolute inset-0 rounded-2xl border border-primary-gold/10 group-hover:border-primary-gold/30 transition-colors duration-500" />

		<div className="relative">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center space-x-3">
					<div className="relative">
						<div className="w-2.5 h-2.5 bg-primary-gold rounded-full animate-pulse" />
						<div className="absolute inset-0 bg-primary-gold/30 rounded-full blur-lg" />
					</div>
					<div className="text-primary-gold font-medium">Locked Message</div>
				</div>
				<div className="text-text-secondary font-medium">{days} days remaining</div>
			</div>

			<h3 className="text-xl font-display font-medium mb-6 text-text-primary group-hover:text-primary-gold transition-colors duration-300">
				{title}
			</h3>

			<div className="space-y-4">
				<div className="relative">
					<div className="absolute inset-0 bg-gradient-to-r from-primary-gold/20 to-primary-gold-light/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
					<div className="relative w-full bg-primary-black/50 rounded-full h-1.5 overflow-hidden">
						<div
							className="bg-gradient-to-r from-primary-gold to-primary-gold-light h-full rounded-full transition-all duration-500 group-hover:animate-pulse"
							style={{ width: `${(days / 365) * 100}%` }}
						/>
					</div>
				</div>
				<div className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-300">
					Unlocks {new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString()}
				</div>
			</div>
		</div>
	</motion.div>
);

export default function Home() {
	const [, setLocation] = useLocation();

	return (
		<div className="relative min-h-screen bg-primary-black overflow-hidden">
			<ParticleBackground />

			{/* Hero Section */}
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
				{/* Background Elements */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 bg-gradient-radial from-primary-gold/20 to-transparent opacity-30 mix-blend-soft-light" />
					<div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-soft-light" />
				</div>

				<motion.div
					className="relative text-center max-w-4xl mx-auto"
					initial="initial"
					animate="animate"
					variants={staggerContainer}
				>
					<motion.div variants={fadeUpScale} className="mb-12 relative">
						{/* Glowing background effect */}
						<div className="absolute -inset-4 bg-gradient-radial from-primary-gold/20 to-transparent opacity-50 blur-2xl" />

						<h1 className="relative font-hero text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-6 sm:mb-8 tracking-tight">
							<div className="flex flex-col gap-2 sm:gap-3">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:gap-4">
									<span className="gradient-text font-medium leading-[1.1] sm:leading-tight">
										Messages for Tomorrow,
									</span>
								</div>
								<span className="text-primary-gold font-light leading-[1.1] sm:leading-tight">Minted Today.</span>
							</div>
						</h1>
					</motion.div>

					<motion.p
						variants={fadeUpScale}
						className="relative text-lg sm:text-xl md:text-2xl text-text-secondary mb-8 sm:mb-12 font-light max-w-2xl mx-auto px-4 sm:px-0"
					>
						<span className="block mb-2 sm:mb-3">
							Write a message, upload a memory, or record a thought — then mint it as a time-locked NFT.
						</span>
						<span className="text-text-primary/90">
							Only the NFT owner can decrypt and view the message. Even we can't see your content — it's truly private.
						</span>
						<div className="flex items-center justify-center mt-6 gap-2">
							<span className="text-text-secondary text-sm">Powered by</span>
							<img src="/hedera-logo-placeholder.jpg" alt="Hedera" className="h-6 w-auto" />
							<span className="text-text-secondary text-sm">blockchain</span>
						</div>
					</motion.p>

					<motion.div
						variants={fadeUpScale}
						className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
					>
						<button onClick={() => setLocation("/create")} className="relative group w-full sm:w-auto">
							{/* Button glow */}
							<div className="absolute inset-0 bg-gradient-to-r from-primary-gold-light via-primary-gold to-primary-gold-light rounded-xl opacity-20 group-hover:opacity-30 blur-md transition-opacity duration-300" />

							{/* Button border */}
							<div className="absolute inset-0 rounded-xl border border-primary-gold/30 group-hover:border-primary-gold/50 transition-colors duration-300" />

							{/* Button content */}
							<div className="relative px-6 sm:px-8 py-4 text-primary-gold group-hover:text-primary-gold-light transition-colors duration-300 font-medium text-base sm:text-lg">
								Create Your Capsule
							</div>
						</button>
						<button onClick={() => setLocation("/gallery")} className="relative group w-full sm:w-auto">
							{/* Button glow */}
							<div className="absolute inset-0 bg-gradient-to-r from-primary-gold/20 to-primary-gold/10 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300" />

							{/* Button border */}
							<div className="absolute inset-0 rounded-xl border border-primary-gold/20 group-hover:border-primary-gold/40 transition-colors duration-300" />

							{/* Button content */}
							<div className="relative px-6 sm:px-8 py-4 text-text-primary group-hover:text-primary-gold transition-colors duration-300 font-medium text-base sm:text-lg">
								Explore Gallery
							</div>
						</button>
					</motion.div>
				</motion.div>

				{/* How It Works Section */}
				<div className="relative mt-32 sm:mt-40 lg:mt-48">
					{/* Section Title */}
					<motion.div
						className="text-center mb-12 sm:mb-16 px-4 sm:px-0"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.6 }}
					>
						<h2 className="font-display text-2xl sm:text-3xl mb-3 sm:mb-4 text-text-primary">How It Works</h2>
					</motion.div>

					{/* Steps Grid */}
					<motion.div
						className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10"
						initial={{ opacity: 0, y: 60 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<NumberIcon number="1" className="w-8 h-8" />
							</div>
							<h3 className="text-xl font-display font-medium mb-4 text-text-primary">Create</h3>
							<p className="text-text-secondary">Write your message or upload a file.</p>
						</motion.div>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<NumberIcon number="2" className="w-8 h-8" />
							</div>
							<h3 className="text-xl font-display font-medium mb-4 text-text-primary">Mint</h3>
							<p className="text-text-secondary">Your capsule becomes an NFT with a set unlock date.</p>
						</motion.div>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<NumberIcon number="3" className="w-8 h-8" />
							</div>
							<h3 className="text-xl font-display font-medium mb-4 text-text-primary">Unlock</h3>
							<p className="text-text-secondary">When the date arrives, the NFT holder can open and view it.</p>
						</motion.div>
					</motion.div>
				</div>

				{/* Why Capsula Section */}
				<div className="relative mt-32 sm:mt-40 lg:mt-48">
					{/* Section Title */}
					<motion.div
						className="text-center mb-12 sm:mb-16 px-4 sm:px-0"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.6 }}
					>
						<div className="flex items-center justify-center mb-6">
							<img src={logo} alt="Capsula" className="h-8 sm:h-10 w-auto" />
						</div>
						<h2 className="font-display text-2xl sm:text-3xl mb-3 sm:mb-4 text-text-primary">Why Choose Us</h2>
					</motion.div>

					{/* Features Grid */}
					<motion.div
						className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10"
						initial={{ opacity: 0, y: 60 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<ClockIcon className="w-8 h-8 text-primary-gold" />
							</div>
							<h3 className="text-lg font-display font-medium mb-3 text-text-primary">Future Delivery</h3>
							<p className="text-text-secondary text-sm">
								Schedule a message for tomorrow, next year, or decades from now.
							</p>
						</motion.div>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<LinkIcon className="w-8 h-8 text-primary-gold" />
							</div>
							<h3 className="text-lg font-display font-medium mb-3 text-text-primary">Truly Private</h3>
							<p className="text-text-secondary text-sm">
								Even our platform can't read your messages — only the NFT owner can decrypt them.
							</p>
						</motion.div>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<GiftIcon className="w-8 h-8 text-primary-gold" />
							</div>
							<h3 className="text-lg font-display font-medium mb-3 text-text-primary">NFT Ownership</h3>
							<p className="text-text-secondary text-sm">
								Only the current NFT holder can access the message — ownership determines access.
							</p>
						</motion.div>
						<motion.div variants={fadeUpScale} className="text-center">
							<div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 mx-auto">
								<InfinityIcon className="w-8 h-8 text-primary-gold" />
							</div>
							<h3 className="text-lg font-display font-medium mb-3 text-text-primary">Hedera Powered</h3>
							<p className="text-text-secondary text-sm">
								Built on Hedera's enterprise-grade blockchain for speed, security, and sustainability.
							</p>
						</motion.div>
					</motion.div>
				</div>

				{/* Sample Capsules Section */}
				<div className="relative mt-32 sm:mt-40 lg:mt-48">
					{/* Section Title */}
					<motion.div
						className="text-center mb-12 sm:mb-16 px-4 sm:px-0"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4, duration: 0.6 }}
					>
						<h2 className="font-display text-2xl sm:text-3xl mb-3 sm:mb-4 text-text-primary">Sample Messages</h2>
						<p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg">
							Discover how Capsula can preserve important information and memories
						</p>
					</motion.div>

					{/* Background Effects */}
					<div className="absolute inset-0 -top-24 overflow-hidden">
						<div className="absolute top-0 left-1/4 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-radial from-primary-gold/10 to-transparent opacity-30 blur-2xl" />
						<div className="absolute bottom-0 right-1/4 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-radial from-primary-gold/10 to-transparent opacity-30 blur-2xl" />
					</div>

					{/* Capsules Grid */}
					<motion.div
						className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
						initial={{ opacity: 0, y: 60 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					>
						<motion.div variants={fadeUpScale}>
							<SampleCapsule days={365} title="Medical Research Data" />
						</motion.div>
						<motion.div variants={fadeUpScale}>
							<SampleCapsule days={180} title="Legal Document Archive" />
						</motion.div>
						<motion.div variants={fadeUpScale}>
							<SampleCapsule days={90} title="Educational Certificate" />
						</motion.div>
					</motion.div>

					{/* View More Link */}
					<motion.div
						className="text-center mt-16"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1, duration: 0.6 }}
					>
						<Link
							to="/gallery"
							className="inline-flex items-center space-x-2 text-text-secondary hover:text-primary-gold transition-colors group hover:scale-105"
						>
							<span className=" inline-block group-hover:text-primary-gold transition-colors z-20">
								Explore All Use Cases
							</span>
							<svg
								className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</Link>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
