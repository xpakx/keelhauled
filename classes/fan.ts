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
		throw new Error("Method not implemented.");
	}

	onMouseLeftClick(position: Position): Card | undefined {
		throw new Error("Method not implemented.");
	}

	onMouseLeftClickRelease(position: Position): void {
		throw new Error("Method not implemented.");
	}

	getCards(): Card[] {
		throw new Error("Method not implemented.");
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
