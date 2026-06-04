import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, isVisible, onClose }) {
	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, y: 50, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 20, scale: 0.95 }}
					transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
					className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
				>
					<div className="bg-primary-surface/95 backdrop-blur-sm border border-primary-gold/30 rounded-lg px-4 py-3 shadow-lg">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
							<span className="text-text-primary text-sm font-medium">{message}</span>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
