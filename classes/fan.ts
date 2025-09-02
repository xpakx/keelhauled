import { Card } from "./card";
import { CardContainer, Position, Size } from "./game";

export type CurveFn = (t: number, radius: number, center: Position) => { x: number; y: number; angle?: number };

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
	center: Position;
	radius: number;

	constructor(canvasSize: Size, center: Position = {x: 0, y: 0}, radius: number = 200, curveFn: CurveFn = Fan.defaultArc) {
		this.center = {
			x: canvasSize.width / 2 + center.x,
			y: canvasSize.height / 2 + center.y,
		};;
		this.curveFn = curveFn;
		this.radius = radius;
	}

	setCards(cards: Card[]) {
		const step = 1 / (cards.length - 1);
		cards.forEach((card, i) => {
			const t = i * step;
			const { x, y, angle } = this.curveFn(t, this.radius, this.center);
			card.dealt = true; // DEBUG
			card.flipped = true; // DEBUG
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
			const cx = card.coord.x;
			const cy = card.coord.y;
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

			const cx = c.coord.x;
			const cy = c.coord.y;

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

	static defaultArc(t: number, radius: number, center: Position) {
		const theta = -Math.PI / 4 + t * (Math.PI / 2);
		return {
			x: center.x + radius * Math.sin(theta),
			y: center.y + -radius * Math.cos(theta) + radius/2,
			angle: theta,
		};
	}
}
