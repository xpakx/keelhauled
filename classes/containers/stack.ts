import { Card, CardSlot, StartDataFn } from "../card.js";
import { Position } from "../game.js";
import { CardContainer, CardsSettingOptions } from "./card-container.js";

export type StackOrientation = "horizontal" | "vertical";

export interface StackOptions {
	orientation?: StackOrientation;
	position?: Position;
}

export class Stack<T> implements CardContainer<T> {
	cards: CardSlot<T>[] = [];
	hoveredIndex: number = -1;
	position: Position;
	initFn?: StartDataFn<T>;

	width: number;
	orientation: StackOrientation;

	constructor(width: number, opt?: StackOptions) {
		const pos = opt?.position || {x: 0, y: 0};
		this.orientation = opt?.orientation || "horizontal";
		this.position = {
			x: pos.x,
			y: pos.y,
		};
		this.width = width;
	}

	setCards(cards: Card[], options?: CardsSettingOptions) {
		const step = this.width/cards.length;
		cards.forEach((card, i) => {
			const x = this.orientation === "horizontal" ? this.position.x + i * step : this.position.x;
			const y = this.orientation === "horizontal" ? this.position.y : this.position.y + i * step;
			card.dealt = true; // DEBUG
			if (options?.flipped) card.flipped = true;
			const slot = new CardSlot<T>({x, y}, i);
			if (this.initFn) slot.setInitFunction(this.initFn);
			slot.putCard(card);
			this.cards.push(slot);
		});
	}

	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D): void {
		this.cards.forEach((slot, i) => {
			const card = slot.getCard();
			if (!card) return;
			const underCursor = i === this.hoveredIndex;
			slot.tick(timestamp, underCursor);

			slot.draw(ctx, {x: slot.coord.x, y: slot.coord.y});
			
		});
	}

	onMouseMove(position: Position): void {
		this.hoveredIndex = this.mouseToIndex(position) ?? -1;
	}

	onMouseLeftClick(position: { x: number; y: number }): CardSlot<T> | undefined {
		const idx = this.mouseToIndex(position);
		if (idx !== undefined) return this.cards[idx];
		return undefined;
	}

	private mouseToIndex(pos: Position): number | undefined {
		if (!this.cards.length) return;

		const step = this.width/this.cards.length;
		const cardWidth = this.cards[0].getCard()!.size.width;
		const cardHeight = this.cards[0].getCard()!.size.height;

		const firstDimCorrect = this.orientation === "horizontal"
			? pos.x >= this.position.x && pos.x <= this.position.x + this.width + cardWidth - this.width/this.cards.length
			: pos.y >= this.position.y && pos.y <= this.position.y + this.width + cardHeight - this.width/this.cards.length;
		if (!firstDimCorrect) return;
		const secondDimCorrect = this.orientation === "horizontal"
			? pos.y >= this.position.y && pos.y <= this.position.y + cardHeight
			: pos.x >= this.position.x && pos.x <= this.position.x + cardWidth;
		if (!secondDimCorrect) return;


		const rel = this.orientation === "horizontal"
			? pos.x - this.position.x
			: pos.y - this.position.y;

		if (rel < 0) return;


		let idx = Math.floor(rel / step);
		if (idx < 0) idx = 0;
		if (idx >= this.cards.length) idx = this.cards.length - 1;

		return idx;
	}

	onMouseLeftClickRelease(_position: Position): void {
	}

	getCards(): Card[] {
		return this.cards.map(c => c.getCard()).filter(c => c !== undefined);
	}

	setDataFunction(fn: StartDataFn<T>) {
		this.initFn = fn;
	}

	removeCard(card: Card | String): CardSlot<T> | undefined {
		const toReturn = card instanceof String ? this.removeCardByName(card) : this.removeCardByCard(card);
		const step = this.width/this.cards.length;

		this.cards.forEach((slot, i) => {
			const x = this.orientation === "horizontal" ? this.position.x + i * step : this.position.x;
			const y = this.orientation === "horizontal" ? this.position.y : this.position.y + i * step;
			slot.coord.x = x;
			slot.coord.y = y;
		});
		return toReturn;
	}

	private removeCardByCard(card: Card): CardSlot<T> | undefined {
		const cardInHand = this.cards.findIndex(c => c.getCard() === card);
		if (cardInHand < 0) return;
		const [toReturn] = this.cards.splice(cardInHand, 1);
		return toReturn;
	}

	private removeCardByName(card: String): CardSlot<T> | undefined {
		const cardInHand = this.cards.findIndex(c => c.getCard()?.name === card);
		if (cardInHand < 0) return;
		const [toReturn] = this.cards.splice(cardInHand, 1);
		return toReturn;
	}
}

