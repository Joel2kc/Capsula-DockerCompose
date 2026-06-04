import { useEffect, useRef } from "react";

export default function ParticleBackground() {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		let animationFrameId;
		let particles = [];

		// Set canvas size
		const setCanvasSize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		setCanvasSize();
		window.addEventListener("resize", setCanvasSize);

		// Particle class
		class Particle {
			constructor() {
				this.x = Math.random() * canvas.width;
				this.y = Math.random() * canvas.height;
				this.size = Math.random() * 5 + 2; // Bigger particles
				this.speedX = Math.random() * 0.15 - 0.075; // Slightly slower
				this.speedY = Math.random() * 0.15 - 0.075;
				this.opacity = Math.random() * 0.5 + 0.3; // More visible
				this.pulseSpeed = Math.random() * 0.02 + 0.01;
				this.pulseOffset = Math.random() * Math.PI * 2;
				this.maxOpacity = this.opacity;
			}

			update() {
				this.x += this.speedX;
				this.y += this.speedY;

				// Wrap around edges with fade
				if (this.x > canvas.width) this.x = 0;
				if (this.x < 0) this.x = canvas.width;
				if (this.y > canvas.height) this.y = 0;
				if (this.y < 0) this.y = canvas.height;

				// Pulsing effect
				this.opacity = this.maxOpacity * (0.5 + Math.sin(Date.now() * this.pulseSpeed + this.pulseOffset) * 0.5);
			}

			draw() {
				// Draw glow effect
				const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
				gradient.addColorStop(0, `rgba(184, 134, 11, ${this.opacity})`);
				gradient.addColorStop(0.4, `rgba(184, 134, 11, ${this.opacity * 0.6})`);
				gradient.addColorStop(1, "rgba(184, 134, 11, 0)");

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
				ctx.fill();

				// Draw core
				ctx.fillStyle = `rgba(218, 165, 32, ${this.opacity})`; // Brighter gold for core
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// Create particles
		const init = () => {
			particles = [];
			const numberOfParticles = (canvas.width * canvas.height) / 18000; // Slightly more particles
			for (let i = 0; i < numberOfParticles; i++) {
				particles.push(new Particle());
			}
		};

		// Animation loop
		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			particles.forEach((particle) => {
				particle.update();
				particle.draw();
			});
			animationFrameId = requestAnimationFrame(animate);
		};

		init();
		animate();

		return () => {
			window.removeEventListener("resize", setCanvasSize);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none"
			style={{
				zIndex: 0,
				opacity: 0.8,
				background: "transparent",
			}}
		/>
	);
}
