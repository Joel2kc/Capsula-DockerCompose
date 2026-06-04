import { Route, Switch } from "wouter";
import { AnimatePresence } from "framer-motion";
import { AppKitProvider } from "./providers/AppKitProvider";
import HeaderButton from "./components/HeaderButton";
import logo from "./assets/logo.png";
import { Link } from "wouter";

// Pages
import Home from "./pages/Home";
import CreateCapsule from "./pages/CreateCapsule";
import Gallery from "./pages/Gallery";
import ViewCapsule from "./pages/ViewCapsule";

// Layout Components
const Layout = ({ children }) => (
	<div className="relative min-h-screen bg-primary-black text-text-primary">
		<nav className="fixed top-0 w-full z-[100] bg-primary-black">
			{/* Gradient line at top */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-gold/50 to-transparent" />

			{/* Nav content */}
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/" className="group flex flex-col items-center justify-center">
						<img
							src={logo}
							alt="Capsula"
							className="h-8 sm:h-12 w-auto group-hover:scale-105 transition-transform duration-300 "
						/>
					</Link>
					<div className="hidden sm:flex items-center gap-2 text-text-secondary text-xs">
						<span>Powered by</span>
						<img src="/hedera-logo-placeholder.jpg" alt="Hedera" className="h-4 w-auto" />
						<span>Hedera</span>
					</div>
				</div>

				<div className="flex items-center">
					<Link to="/gallery" className="relative group hidden sm:block mr-8">
						<span className="text-text-primary/90 font-medium text-lg group-hover:text-primary-gold transition-colors duration-300">
							Gallery
						</span>
						<div className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-primary-gold to-primary-gold-light group-hover:w-full transition-all duration-300" />
					</Link>
					<HeaderButton />
				</div>
			</div>
		</nav>
		<main className="relative pt-20 z-10">{children}</main>
	</div>
);

export default function App() {
	return (
		<AppKitProvider>
			<Layout>
				<AnimatePresence mode="wait">
					<Switch>
						<Route path="/" component={Home} />
						<Route path="/create" component={CreateCapsule} />
						<Route path="/gallery" component={Gallery} />
						<Route path="/capsule/:id" component={ViewCapsule} />
					</Switch>
				</AnimatePresence>
			</Layout>
		</AppKitProvider>
	);
}
