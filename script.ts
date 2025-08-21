class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	prevTimestamp: number = 0;
	cellSize = 70;

	gridSize = 5;

	constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		this.context = context;
		this.canvas = canvas;
	}

	nextFrame(_timestamp: number) {
		this.drawGrid();
	}

	drawGrid() {
		this.context.save();
		const gridPixelWidth = this.cellSize*this.gridSize;
		const gridPixelHeight = this.cellSize*this.gridSize;
		const offsetX = (this.canvas.width - gridPixelWidth) / 2;
		const offsetY = (this.canvas.height - gridPixelHeight) / 2;

		this.context.translate(offsetX + 0.5, offsetY + 0.5);
		for (let i = 0; i <= this.gridSize; i++) {
			const x = i * this.cellSize;
			this.context.beginPath();
			this.context.moveTo(x, 0);
			this.context.lineTo(x, gridPixelWidth);
			this.context.strokeStyle = "#aaa";
			this.context.stroke();
		}

		for (let j = 0; j <= this.gridSize; j++) {
			const y = j * this.cellSize;
			this.context.beginPath();
			this.context.moveTo(0, y);
			this.context.lineTo(gridPixelHeight, y);
			this.context.strokeStyle = "#aaa";
			this.context.stroke();
		}
		this.context.restore();
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
}
