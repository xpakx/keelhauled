import { Card } from "./card.js";
import { CardContainer, Position, Size } from "./game.js";

interface CardGridData {
	card: Card;
	coord: Position;
	zIndex: number;
}

export class Circle implements CardContainer {
	center: Position;
	radius: number;
	cards: CardGridData[] = [];
	hoveredIndex: number = -1;
	angleOffset: number = -Math.PI / 2; 

	constructor(center: Position, canvasSize: Size, radius: number) {
		this.center = {
			x: canvasSize.width / 2 + center.x,
			y: canvasSize.height / 2 + center.y,
		};;
		this.radius = radius;
	}

	setCards(cards: Card[]) {
		this.cards = cards.map(c => {
			return {
				card: c,
				coord: {x: 0, y: 0},
				zIndex: 0,
			}
		});
		this.positionCards();
	}

	private positionCards() {
		const n = this.cards.length;
		for (let i = 0; i < n; i++) {
			const card = this.cards[i];
			const angle = (2 * Math.PI * i) / n + this.angleOffset;

			card.coord.x = this.center.x + this.radius * Math.cos(angle) - card.card.size.width / 2;
			card.coord.y = this.center.y + this.radius * Math.sin(angle) - card.card.size.height / 2;
			const dx = this.center.x - card.coord.x - card.card.size.width / 2;
			const dy = this.center.y - card.coord.y - card.card.size.height / 2;
			this.cards[i].card.deal({ x: dx, y: dy }, i*150);
		}
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

		const card = this.cards[rawIndex];

		const x0 = card.coord.x;
		const y0 = card.coord.y;
		const x1 = card.coord.x + card.card.size.width;
		const y1 = card.coord.y + card.card.size.height;
		if (mousePos.x < x0 || mousePos.x > x1) return;
		if (mousePos.y < y0 || mousePos.y > y1) return;
		return rawIndex;
	}

	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D) {
		this.cards.forEach((card, i) => {
			const underCursor = i === this.hoveredIndex;
			card.card.tick(timestamp, underCursor);
			card.card.draw(ctx, { x: card.coord.x, y: card.coord.y });
		});
	}

	onMouseMove(position: Position) {
		this.hoveredIndex = this.mouseToIndex(position) ?? -1;
	}

	onMouseLeftClick(position: Position): Card | undefined {
		const idx = this.mouseToIndex(position);
		if (idx !== undefined) return this.cards[idx].card;
	}

	onMouseLeftClickRelease(_position: Position) { }

	sortCards() {
		this.cards.sort((a, b) => {
			return a.zIndex - b.zIndex;
		});
	}

	getCards(): Card[] {
		return this.cards.map(c => c.card);
	}
}
