import { Card } from "./card.js";

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

export class Hand {
	cards: Card[] = [];
	position: Position = {x: 0, y: 0};
	size: Size = {height: 150, width: 800};
	
	calculatePosition(canvasSize: Size) {
		const widthMargin = Math.abs((this.size.width - canvasSize.width)/2)
		this.position.x = widthMargin;
		this.position.y = canvasSize.height - this.size.height;
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.drawCards(ctx);
	}

	addCard(card: Card) {
		card.flipped = true;
		this.cards.push(card);
	}

	drawCards(ctx: CanvasRenderingContext2D) {
		ctx.save();
		const cardsLength = this.cards.length * 100;
		const padding = Math.abs((cardsLength - this.size.width)/2)
		ctx.translate(this.position.x + padding, this.position.y);
		let i = 0;
		for (let card of this.cards) {
			card.draw(ctx, {
				x: i*100,
				y: 0,
			});
			i++;
		}
		ctx.restore();
	}
}

export class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	prevTimestamp: number = 0;
	cellSize = 100;

	coord: Position = {x: -1, y: -1};
	mouseCoord: Position = {x: -1, y: -1};

	defaultCanvasSize: Size = {width: 800, height: 600};

	gridSize: Size = {width: 0, height: 0};

	grid: Card[][] = [];
	cards: CardContainer[] = [];
	hand: Hand;

	gridPixelSize: Size = {width: 0, height: 0};
	gridOffset: Position = {x: 0, y:0};
	gridEnd: Position = {x: 0, y:0};
	cellImageHidden?: HTMLImageElement;
	cellImage?: HTMLImageElement;

	constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		this.context = context;
		this.canvas = canvas;
		this.setCanvasSize(this.defaultCanvasSize);
		canvas.width = 800;
		canvas.height = 600;
		this.setGridSize({width: 5, height: 5});
		this.hand = new Hand();
		this.hand.calculatePosition(this.defaultCanvasSize);
		this.hand.addCard(
			new Card(undefined, undefined, {width: this.cellSize, height: this.cellSize})
		);
	}

	nextFrame(timestamp: number) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid(timestamp);
		this.hand.draw(this.context);
	}

	setCanvasSize(size: Size) {
		this.canvas.width = size.width;
		this.canvas.height = size.height;
	}

	setGridSize(size: Size) {
		const img = this.cellImageHidden;
		const img2 = this.cellImage;
		this.grid = Array(size.width);
		for (let i = 0; i < this.gridSize.width; i++) {
			this.grid[i] = Array(size.height);
			for (let j = 0; j < this.gridSize.height; j++) {
				const card = new Card(img, img2, {width: this.cellSize, height: this.cellSize})
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

		this.gridSize = size;
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

	setCellImage(image: HTMLImageElement) {
		this.cellImageHidden = image;
	}

	setFaceImage(image: HTMLImageElement) {
		this.cellImage = image;
	}

	onMouseLeftClick(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		const coord = this.mouseToGridCoord(this.mouseCoord);
		if (coord) {
			this.grid[coord.x][coord.y].revealCard();
		} 
	}

	sortCards() {
		this.cards.sort((a, b) => {
			return a.zIndex - b.zIndex;
		});
	}
}
