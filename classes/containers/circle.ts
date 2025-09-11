import { Card, CardSlot, StartDataFn } from "../card.js";
import { Position, Size } from "../game.js";
import { CardContainer, CardsSettingOptions } from "./card-container.js";

export class Circle<T> implements CardContainer<T> {
	center: Position;
	radius: number;
	cards: CardSlot<T>[] = [];
	hoveredIndex: number = -1;
	angleOffset: number = -Math.PI / 2; 
	drawOrder: number[] = [];
	initFn?: StartDataFn<T>;

	constructor(center: Position, canvasSize: Size, radius: number) {
		this.center = {
			x: canvasSize.width / 2 + center.x,
			y: canvasSize.height / 2 + center.y,
		};
		this.radius = radius;
	}

	setDataFunction(fn: StartDataFn<T>) {
		this.initFn = fn;
	}

	setCards(cards: Card[], options?: CardsSettingOptions) {
		const newCards = cards.map((c, i) => {
			const slot = (i < this.cards.length) ? this.cards[i] : new CardSlot<T>({x: 0, y: 0}, 0);
			if (this.initFn) slot.setInitFunction(this.initFn);
			slot.putCard(c);
			if (options?.flipped) c.flipped = true;
			return slot;
		});
		this.cards = newCards;
		this.positionCards();
	}

	private positionCards() {
		const n = this.cards.length;
		for (let i = 0; i < n; i++) {
			const slot = this.cards[i];
			const card = slot.getCard();
			if (!card) continue;

			const angle = (2 * Math.PI * i) / n + this.angleOffset;

			slot.coord.x = this.center.x + this.radius * Math.cos(angle) - card.size.width / 2;
			slot.coord.y = this.center.y + this.radius * Math.sin(angle) - card.size.height / 2;
			slot.zIndex = n - i;
			const dx = this.center.x - slot.coord.x - card.size.width / 2;
			const dy = this.center.y - slot.coord.y - card.size.height / 2;
			card.deal({ x: dx, y: dy }, i*150);
		}
		this.sortCards();
	}

	private mouseToIndex(mousePos: Position): number | undefined {
		if (!this.cards.length) return;

		const dx = mousePos.x - this.center.x;
		const dy = mousePos.y - this.center.y;

		let angle = Math.atan2(dy, dx);
		angle -= this.angleOffset;
		if (angle < 0) angle += 2 * Math.PI;

		const step = (2 * Math.PI) / this.cards.length;
		const rawIndex = Math.round(angle / step) % this.cards.length;

		const slot = this.cards[rawIndex];
		const card = slot.getCard();
		if (!card) return -1;

		const x0 = slot.coord.x;
		const y0 = slot.coord.y;
		const x1 = slot.coord.x + card.size.width;
		const y1 = slot.coord.y + card.size.height;
		if (mousePos.x < x0 || mousePos.x > x1) return;
		if (mousePos.y < y0 || mousePos.y > y1) return;
		return rawIndex;
	}

	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D) {
		for (let i of this.drawOrder) {
			const slot = this.cards[i];
			const underCursor = i === this.hoveredIndex;
			slot.tick(timestamp, underCursor);
			slot.draw(ctx, { x: slot.coord.x, y: slot.coord.y });
		};
	}

	onMouseMove(position: Position) {
		this.hoveredIndex = this.mouseToIndex(position) ?? -1;
	}

	onMouseLeftClick(position: Position): CardSlot<T> | undefined {
		const idx = this.mouseToIndex(position);
		if (idx !== undefined) return this.cards[idx];
	}

	onMouseLeftClickRelease(_position: Position) { }

	sortCards() {
		this.drawOrder = this.cards.map((_, i) => i);
		this.drawOrder.sort((a, b) => this.cards[a].zIndex - this.cards[b].zIndex);
	}

	getCards(): Card[] {
		return this.cards.map(c => c.getCard()).filter(c => c !== undefined);
	}
}
