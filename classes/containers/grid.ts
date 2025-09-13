import { CardProducer } from "../card-lib.js";
import { Card, CardSlot, StartDataFn } from "../card.js";
import { Position, Size } from "../game.js";
import { CardContainer, CardsSettingOptions } from "./card-container.js";
import { Rules } from "../rules.js";

export class Grid<T> implements CardContainer<T> {
	cellSize = 100;

	coord: Position = {x: -1, y: -1};

	gridSize: Size = {width: 0, height: 0};

	grid: CardSlot<T>[][] = [];
	cards: CardSlot<T>[] = [];

	gridPixelSize: Size = {width: 0, height: 0};
	gridOffset: Position = {x: 0, y:0};
	gridEnd: Position = {x: 0, y:0};

	initFn?: StartDataFn<T>;

	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D) {
		this.drawGrid(timestamp, ctx);
	}

	setGridSize(size: Size, canvasSize: Size, cardSource: CardProducer, rules: Rules) {
		this.gridSize = size;

		this.grid = Array(this.gridSize.width);
		for (let i = 0; i < this.gridSize.width; i++) {
			this.grid[i] = Array(size.height);
			for (let j = 0; j < this.gridSize.height; j++) {
				const cx = (this.gridSize.width - 1) / 2;
				const cy = (this.gridSize.height - 1) / 2;

				const zIndex = Math.abs(i - cx) + Math.abs(j - cy);

				const slot = new CardSlot<T>({x: i, y: j}, zIndex);
				if (this.initFn) slot.setInitFunction(this.initFn);
				this.cards.push(slot);
				this.grid[i][j] = slot;
				
				if ((rules as any).drawCard) this.fallbackForDrawCard(slot, cardSource, rules); 
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

	private fallbackForDrawCard(slot: CardSlot<T>, cardSource: CardProducer, rules: Rules) {
		// @ts-expect-error using deprecated API intentionally
		const card = cardSource.getCard(rules.drawCard() || "empty");
		if (!card) return;

		slot.putCard(card);
		this.dealCard(slot);
	}

	private dealCard(slot: CardSlot<T>) {
		const card = slot.getCard();
		if (!card) return;

		const x = -slot.coord.x * this.cellSize + this.gridSize.width*this.cellSize/2 - this.cellSize/2;
		const y = -slot.coord.y * this.cellSize + this.gridSize.height*this.cellSize/2 - this.cellSize/2;

		const cx = (this.gridSize.width - 1) / 2;
		const cy = (this.gridSize.height - 1) / 2;

		const maxDist = Math.abs(cx) + Math.abs(cy);

		card.deal({x, y}, (maxDist-slot.zIndex)*300);
	}

	setCards(cards: Card[], options?: CardsSettingOptions) {
		const n = Math.min(cards.length, this.cards.length);

		for (let i = 0; i < n; i++) {
			const card = cards[i];
			const slot = this.cards[i];
			slot.putCard(card);
			if (options?.flipped) card.flipped = true;
			this.dealCard(slot);
		}
	}

	drawGrid(timestamp: number, ctx: CanvasRenderingContext2D) {
		ctx.save();

		ctx.translate(this.gridOffset.x + 0.5, this.gridOffset.y + 0.5);

		for (let slot of this.cards) {
			const x = slot.coord.x * this.cellSize;
			const y = slot.coord.y * this.cellSize;
			const underCursor = slot.coord.x == this.coord.x && slot.coord.y == this.coord.y;
			slot.tick(timestamp, underCursor);
			slot.draw(ctx, {x, y});
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

	onMouseLeftClick(position: Position): CardSlot<T> | undefined {
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

	getCards(): Card[] {
		return this.cards.map(c => c.getCard()).filter(c => c !== undefined);
	}

	setDataFunction(fn: StartDataFn<T>) {
		this.initFn = fn;
	}

	removeCard(_card: Card | string): CardSlot<T> | undefined {
		// TODO: implement
		return;
	}

	addCard(_card: Card | CardSlot<T>): void {
		// TODO: implement
	}

	clear(): void {
		for (let slot of this.cards) slot.removeCard();
	}
}
