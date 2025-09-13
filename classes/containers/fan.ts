import { Card, CardSlot, StartDataFn } from "../card.js";
import { Position, Size } from "../game.js";
import { CardContainer, CardsSettingOptions } from "./card-container.js";

export type CurveFn = (t: number, radius: number, center: Position) => { x: number; y: number; angle?: number };

export class Fan<T> implements CardContainer<T> {
	curveFn: CurveFn;
	cards: CardSlot<T>[] = [];
	hoveredIndex: number = -1;
	center: Position;
	radius: number;

	maxCards: number = 10;

	visualDebug: boolean = false;

	initFn?: StartDataFn<T>;

	constructor(canvasSize: Size, center: Position = {x: 0, y: 0}, radius: number = 200, curveFn: CurveFn = Fan.defaultArc) {
		this.center = {
			x: canvasSize.width / 2 + center.x,
			y: canvasSize.height / 2 + center.y,
		};;
		this.curveFn = curveFn;
		this.radius = radius;
	}

	setCards(cards: Card[], options?: CardsSettingOptions) {
		const step = 1 / (this.maxCards - 1);
		const start = Math.max(0, (this.maxCards - cards.length)/2)*step;
		cards.forEach((card, i) => {
			const t = start + i * step;
			const { x, y, angle } = this.curveFn(t, this.radius, this.center);
			card.dealt = true; // DEBUG
			card.flipped = true; // DEBUG
			const slot = new CardSlot<T>({x, y}, i, angle);
			if (this.initFn) slot.setInitFunction(this.initFn);
			if (options?.flipped) card.flipped = true;
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

			ctx.save();
			const cx = slot.coord.x;
			const cy = slot.coord.y;
			ctx.translate(cx, cy);
			ctx.rotate(slot.angle);
			slot.draw(ctx, { x: -card.size.width / 2, y: -card.size.height / 2 });
			ctx.restore();

			
		});

		if (this.visualDebug) {
			this.cards.forEach((card) => ctx.fillRect(card.coord.x, card.coord.y, 10, 10))
			ctx.fillRect(this.center.x, this.center.y, 10, 10);
		}
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

		// TODO
		for (let i = this.cards.length - 1; i >= 0; i--) {
			const slot = this.cards[i];
			const card = slot.getCard();
			if (!card) continue;

			const cx = slot.coord.x;
			const cy = slot.coord.y;

			const dx = pos.x - cx;
			const dy = pos.y - cy;

			const angle = -slot.angle;
			const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
			const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

			const w = card.size.width / 2;
			const h = card.size.height / 2;
			if (localX >= -w && localX <= w && localY >= -h && localY <= h) {
				return i;
			}
		}
	}

	onMouseLeftClickRelease(_position: Position): void {
	}

	getCards(): Card[] {
		return this.cards.map(c => c.getCard()).filter(c => c !== undefined);
	}

	static defaultArc(t: number, radius: number, center: Position) {
		const theta = -Math.PI / 4 + t * (Math.PI / 2);
		return {
			x: center.x + radius * Math.sin(theta),
			y: center.y + -radius * Math.cos(theta) + radius/2,
			angle: theta,
		};
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
