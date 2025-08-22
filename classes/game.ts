export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

export class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	prevTimestamp: number = 0;
	cellSize = 70;

	coord: Position = {x: -1, y: -1};
	mouseCoord: Position = {x: -1, y: -1};

	defaultCanvasSize: Size = {width: 800, height: 600};

	gridSize: Size = {width: 0, height: 0};
	gridPixelSize: Size = {width: 0, height: 0};
	gridOffset: Position = {x: 0, y:0};
	gridEnd: Position = {x: 0, y:0};

	constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		this.context = context;
		this.canvas = canvas;
		this.setCanvasSize(this.defaultCanvasSize);
		canvas.width = 800;
		canvas.height = 600;
		this.setGridSize({width: 7, height: 5});
	}

	nextFrame(_timestamp: number) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid();
	}

	setCanvasSize(size: Size) {
		this.canvas.width = size.width;
		this.canvas.height = size.height;
	}

	setGridSize(size: Size) {
		this.gridSize = size;
		this.gridPixelSize.width = this.cellSize*this.gridSize.width;
		this.gridPixelSize.height = this.cellSize*this.gridSize.height;
		this.gridOffset.x = (this.canvas.width - this.gridPixelSize.width) / 2;
		this.gridOffset.y = (this.canvas.height - this.gridPixelSize.height) / 2;
		this.gridEnd.x = this.gridOffset.x + this.gridSize.width*this.cellSize;
		this.gridEnd.y = this.gridOffset.y + this.gridSize.height*this.cellSize;
	}

	drawGrid() {
		this.context.save();

		this.context.translate(this.gridOffset.x + 0.5, this.gridOffset.y + 0.5);

		for (let i = 0; i < this.gridSize.width; i++) {
			for (let j = 0; j < this.gridSize.height; j++) {
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
		const coord = this.mouseToGridCoord(this.mouseCoord);
		if (coord) {
			this.coord.x = coord.x;
			this.coord.y = coord.y;
		} else {
			this.coord.x = -1; 
			this.coord.y = -1;
		}
	}

	isPositionInGrid(position: Position): boolean {
		if (position.x < this.gridOffset.x || position.y < this.gridOffset.y) return false;
		if (position.x > this.gridEnd.x || position.y > this.gridEnd.y) return false;
		return true;
	}

	mouseToGridCoord(mousePos: Position) {
		if (!this.isPositionInGrid(mousePos)) return;
		const mapX = Math.floor((mousePos.x - this.gridOffset.x) / this.cellSize);
		const mapY = Math.floor((mousePos.y - this.gridOffset.y) / this.cellSize);
		return {x: mapX, y: mapY};
	}

}
