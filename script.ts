class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	prevTimestamp: number = 0;
	cellSize = 70;

	gridWidth = 7;
	gridHeight = 5;

	constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		this.context = context;
		this.canvas = canvas;
	}

	nextFrame(_timestamp: number) {
		this.drawGrid();
	}

	drawGrid() {
		this.context.save();
		const gridPixelWidth = this.cellSize*this.gridWidth;
		const gridPixelHeight = this.cellSize*this.gridHeight;
		const offsetX = (this.canvas.width - gridPixelWidth) / 2;
		const offsetY = (this.canvas.height - gridPixelHeight) / 2;

		this.context.translate(offsetX + 0.5, offsetY + 0.5);

		for (let i = 0; i < this.gridWidth; i++) {
			for (let j = 0; j < this.gridHeight; j++) {
				const x = i * this.cellSize;
				const y = j * this.cellSize;
				this.context.strokeRect(x, y, this.cellSize, this.cellSize)
			}
		}
		this.context.restore();
	}

	onMouseMove(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		this.mouseToGridCoord(mouseX, mouseY);
	}

	mouseToGridCoord(mouseX: number, mouseY: number) {
		const gridPixelWidth = this.cellSize*this.gridWidth;
		const gridPixelHeight = this.cellSize*this.gridHeight;
		const offsetX = (this.canvas.width - gridPixelWidth) / 2;
		const offsetY = (this.canvas.height - gridPixelHeight) / 2;
		const endX = offsetX + this.gridWidth*this.cellSize;
		const endY = offsetY + this.gridHeight*this.cellSize;
		if (mouseX < offsetX || mouseY < offsetY) {
			console.log("outside of map");
			return
		}
		if (mouseX > endX || mouseY > endY) {
			console.log("outside of map");
			return
		}
		const mapX = Math.floor((mouseX - offsetX) / this.cellSize);
		const mapY = Math.floor((mouseY - offsetY) / this.cellSize);
		console.log(mapX + ". " + mapY)
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

	canvas.addEventListener('mousemove', function(event) {
		game.onMouseMove(event);
	});
}
