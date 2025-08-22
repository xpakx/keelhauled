import { Game } from "./classes/game.js";

window.onload = async () => {
	const canvas = document.getElementById('gameCanvas') as (HTMLCanvasElement | null);
	if (!canvas) {
		console.log('No canvas elem');
		return;
	}
	const context = canvas.getContext('2d');
	if (!context) {
		console.log("No context");
		return;
	}

	canvas.width = 800;
	canvas.height = 600;
	let game = new Game(context, canvas);

	const frame = (timestamp: number) => {
		game.nextFrame(timestamp);
		window.requestAnimationFrame(frame);
	};

	window.requestAnimationFrame((timestamp) => {
		game.prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});

	canvas.addEventListener('mousemove', function(event) {
		game.onMouseMove(event);
	});
}
