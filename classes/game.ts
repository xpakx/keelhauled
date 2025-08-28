import { CardLibrary } from "./card-lib.js";
import { Card } from "./card.js";
import { Hand } from "./hand.js";
import { Rules } from "./rules.js";

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

export interface CardContainer {
	card: Card;
	coord: Position;
	zIndex: number;
}

export class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	cardLib: CardLibrary;
	prevTimestamp: number = 0;
	cellSize = 100;

	coord: Position = {x: -1, y: -1};
	mouseCoord: Position = {x: -1, y: -1};

	defaultCanvasSize: Size = {width: 800, height: 800};

	gridSize: Size = {width: 0, height: 0};

	grid: Card[][] = [];
	cards: CardContainer[] = [];
	hand: Hand;
	rules: Rules;

	gridPixelSize: Size = {width: 0, height: 0};
	gridOffset: Position = {x: 0, y:0};
	gridEnd: Position = {x: 0, y:0};

	constructor(
		context: CanvasRenderingContext2D, 
		canvas: HTMLCanvasElement,
		cardLib: CardLibrary,
		rules: Rules,
	) {
		this.context = context;
		this.canvas = canvas;
		this.cardLib = cardLib;
		this.setCanvasSize(this.defaultCanvasSize);
		this.hand = new Hand();
		this.hand.calculatePosition(this.defaultCanvasSize);
		this.rules = rules;
		this.rules.init(this);
	}

	nextFrame(timestamp: number) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid(timestamp);
		this.hand.tick(timestamp, this.mouseCoord);
		this.hand.draw(this.context);
		if (this.hand.dragging && this.hand.selectedCard) {
			const pos = {
				x: this.mouseCoord.x - this.hand.selectedCard.size.width/2, 
				y: this.mouseCoord.y - this.hand.selectedCard.size.height/2
			};
			this.hand.selectedCard?.draw(this.context, pos);
		}

		if (this.rules.isGameOver(this)) {
			console.log("Game Over!", this.rules.getState?.());
		}
	}

	setCanvasSize(size: Size) {
		this.canvas.width = size.width;
		this.canvas.height = size.height;
	}

	setGridSize(size: Size) {
		this.gridSize = size;

		this.grid = Array(this.gridSize.width);
		for (let i = 0; i < this.gridSize.width; i++) {
			this.grid[i] = Array(size.height);
			for (let j = 0; j < this.gridSize.height; j++) {
				const card = this.cardLib.getCard(this.rules.drawCard() || "empty");
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
		this.gridOffset.x = (this.canvas.width - this.gridPixelSize.width) / 2;
		this.gridOffset.y = (this.canvas.height - this.gridPixelSize.height) / 2;
		this.gridEnd.x = this.gridOffset.x + this.gridSize.width*this.cellSize;
		this.gridEnd.y = this.gridOffset.y + this.gridSize.height*this.cellSize;
	}

	drawGrid(timestamp: number) {
		this.context.save();

		this.context.translate(this.gridOffset.x + 0.5, this.gridOffset.y + 0.5);

		for (let card of this.cards) {
			const x = card.coord.x * this.cellSize;
			const y = card.coord.y * this.cellSize;
			const underCursor = card.coord.x == this.coord.x && card.coord.y == this.coord.y;
			card.card.tick(timestamp, underCursor);
			card.card.draw(this.context, {x, y});
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

	onMouseLeftClick(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		const coord = this.mouseToGridCoord(this.mouseCoord);
		if (coord) {
			const card = this.grid[coord.x][coord.y];
			this.rules.onCardClick(this, card, coord);
		} else {
			this.hand.onMouseLeftClick(this.mouseCoord);
		}
	}

	onMouseLeftClickRelease(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		this.hand.onLeftMouseClickRelease(this.mouseCoord);
	}

	sortCards() {
		this.cards.sort((a, b) => {
			return a.zIndex - b.zIndex;
		});
	}

	__debugAddHand() {
		this.hand.addCard(this.cardLib.getCard("empty")!);
	}
}
