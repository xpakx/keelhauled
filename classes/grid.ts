import { CardProducer } from "./card-lib.js";
import { Card } from "./card.js";
import { CardContainer, Position, Size } from "./game.js";
import { Rules } from "./rules.js";

export class Grid {
	cellSize = 100;

	coord: Position = {x: -1, y: -1};

	gridSize: Size = {width: 0, height: 0};

	grid: Card[][] = [];
	cards: CardContainer[] = [];

	gridPixelSize: Size = {width: 0, height: 0};
	gridOffset: Position = {x: 0, y:0};
	gridEnd: Position = {x: 0, y:0};

	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D) {
		this.drawGrid(timestamp, ctx);
	}

	setGridSize(size: Size, canvasSize: Size, cardSource: CardProducer, rules: Rules) {
		this.gridSize = size;

		this.grid = Array(this.gridSize.width);
		for (let i = 0; i < this.gridSize.width; i++) {
			this.grid[i] = Array(size.height);
			for (let j = 0; j < this.gridSize.height; j++) {
				const card = cardSource.getCard(rules.drawCard() || "empty");
				if (!card) continue;
				this.grid[i][j] = card;

				const x = -i * this.cellSize + this.gridSize.width*this.cellSize/2 - this.cellSize/2;
				const y = -j * this.cellSize + this.gridSize.height*this.cellSize/2 - this.cellSize/2;


				const cx = (this.gridSize.width - 1) / 2;
				const cy = (this.gridSize.height - 1) / 2;

				const zIndex = Math.abs(i - cx) + Math.abs(j - cy);
				const maxDist = Math.abs(cx) + Math.abs(cy);

				this.cards.push({card, coord: {x: i, y: j}, zIndex});

				card.deal({x, y}, (maxDist-zIndex)*300);
			}
		}
		this.sortCards();

		this.gridPixelSize.width = this.cellSize*this.gridSize.width;
		this.gridPixelSize.height = this.cellSize*this.gridSize.height;
		this.gridOffset.x = (canvasSize.width - this.gridPixelSize.width) / 2;
		this.gridOffset.y = (canvasSize.height - this.gridPixelSize.height) / 2;
		this.gridEnd.x = this.gridOffset.x + this.gridSize.width*this.cellSize;
		this.gridEnd.y = this.gridOffset.y + this.gridSize.height*this.cellSize;
	}

	drawGrid(timestamp: number, ctx: CanvasRenderingContext2D) {
		ctx.save();

		ctx.translate(this.gridOffset.x + 0.5, this.gridOffset.y + 0.5);

		for (let card of this.cards) {
			const x = card.coord.x * this.cellSize;
			const y = card.coord.y * this.cellSize;
			const underCursor = card.coord.x == this.coord.x && card.coord.y == this.coord.y;
			card.card.tick(timestamp, underCursor);
			card.card.draw(ctx, {x, y});
		}

		ctx.restore();
	}

	onMouseMove(position: Position) {
		const coord = this.mouseToGridCoord(position);
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

	onMouseLeftClick(position: Position): Card | undefined {
		const coord = this.mouseToGridCoord(position);
		if (coord) {
			return this.grid[coord.x][coord.y];
		}
	}

	onMouseLeftClickRelease(_position: Position) { }

	sortCards() {
		this.cards.sort((a, b) => {
			return a.zIndex - b.zIndex;
		});
	}
}
