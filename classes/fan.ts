import { Card } from "./card";
import { CardContainer, Position } from "./game";

export type CurveFn = (t: number) => { x: number; y: number; angle?: number };

interface CardGridData {
	card: Card;
	coord: Position;
	angle: number;
	zIndex: number;
}

export class Fan implements CardContainer {
	curveFn: CurveFn;
	cards: CardGridData[] = [];
	hoveredIndex: number = -1;

	constructor(curveFn: CurveFn = Fan.defaultArc) {
		this.curveFn = curveFn;
	}

	setCards(cards: Card[]) {
		const step = 1 / (cards.length - 1);
		cards.forEach((card, i) => {
			const t = i * step;
			const { x, y, angle } = this.curveFn(t);
			this.cards.push({
				card: card,
				zIndex: step,
				coord: {x, y},
				angle: angle ? angle : 0,
			});
		});
	}

	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D): void {
		this.cards.forEach((card, i) => {
			const underCursor = i === this.hoveredIndex;
			card.card.tick(timestamp, underCursor);

			ctx.save();
			const cx = card.coord.x + card.card.size.width / 2;
			const cy = card.coord.y + card.card.size.height / 2;
			ctx.translate(cx, cy);
			ctx.rotate(card.angle);
			card.card.draw(ctx, { x: -card.card.size.width / 2, y: -card.card.size.height / 2 });
			ctx.restore();
		});
	}

	onMouseMove(position: Position): void {
		this.hoveredIndex = this.mouseToIndex(position) ?? -1;
	}

	onMouseLeftClick(position: { x: number; y: number }): Card | undefined {
		const idx = this.mouseToIndex(position);
		if (idx !== undefined) return this.cards[idx].card;
		return undefined;
	}

	private mouseToIndex(pos: Position): number | undefined {
		if (!this.cards.length) return;

		// TODO
		for (let i = this.cards.length - 1; i >= 0; i--) {
			const c = this.cards[i];

			const cx = c.coord.x + c.card.size.width / 2;
			const cy = c.coord.y + c.card.size.height / 2;

			const dx = pos.x - cx;
			const dy = pos.y - cy;

			const angle = -c.angle;
			const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
			const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

			const w = c.card.size.width / 2;
			const h = c.card.size.height / 2;
			if (localX >= -w && localX <= w && localY >= -h && localY <= h) {
				return i;
			}
		}
	}

	onMouseLeftClickRelease(_position: Position): void {
	}

	getCards(): Card[] {
		return this.cards.map(c => c.card);
	}

	static defaultArc(t: number) {
		const radius = 200;

		const theta = -Math.PI / 4 + t * (Math.PI / 2);
		return {
			x: 200 + radius * Math.sin(theta),
			y: 500 + -radius * Math.cos(theta),
			angle: theta,
		};
	}
}
