export interface Size {
	width: number;
	height: number;
}

export class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	prevTimestamp: number = 0;
	cellSize = 70;

	gridWidth = 7;
	gridHeight = 5;

	coord = {x: -1, y: -1};
	mouseCoord = {x: -1, y: -1};

	defaultCanvasSize: Size = {width: 800, height: 600};

	constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		this.context = context;
		this.canvas = canvas;
		this.setCanvasSize(this.defaultCanvasSize);
		canvas.width = 800;
		canvas.height = 600;
	}

	nextFrame(_timestamp: number) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid();
	}

	setCanvasSize(size: Size) {
		this.canvas.width = size.width;
		this.canvas.height = size.height;
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
				if (i == this.coord.x && j == this.coord.y) {
					this.context.fillRect(x, y, this.cellSize, this.cellSize)
				}
			}
		}
		this.context.restore();
	}

	onMouseMove(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		const coord = this.mouseToGridCoord(this.mouseCoord.x, this.mouseCoord.y);
		if (coord) {
			this.coord.x = coord.x;
			this.coord.y = coord.y;
		} else {
			this.coord.x = -1; 
			this.coord.y = -1;
		}
	}

	mouseToGridCoord(mouseX: number, mouseY: number) {
		const gridPixelWidth = this.cellSize*this.gridWidth;
		const gridPixelHeight = this.cellSize*this.gridHeight;
		const offsetX = (this.canvas.width - gridPixelWidth) / 2;
		const offsetY = (this.canvas.height - gridPixelHeight) / 2;
		const endX = offsetX + this.gridWidth*this.cellSize;
		const endY = offsetY + this.gridHeight*this.cellSize;
		if (mouseX < offsetX || mouseY < offsetY) {
			return
		}
		if (mouseX > endX || mouseY > endY) {
			return
		}
		const mapX = Math.floor((mouseX - offsetX) / this.cellSize);
		const mapY = Math.floor((mouseY - offsetY) / this.cellSize);
		return {x: mapX, y: mapY};
	}

}
