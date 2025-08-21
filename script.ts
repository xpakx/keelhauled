class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	prevTimestamp: number = 0;

	constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		this.context = context;
		this.canvas = canvas;
	}

	nextFrame(_timestamp: number) {
	}
}

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

	canvas.width = 300;
	canvas.height = 200;
	let game = new Game(context, canvas);

	const frame = (timestamp: number) => {
		game.nextFrame(timestamp);
		window.requestAnimationFrame(frame);
	};

	window.requestAnimationFrame((timestamp) => {
		game.prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});
}
