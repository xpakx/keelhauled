import { CardSlot } from "./card";
import { Position, Size } from "./game";

export interface Action<T> {
	name: string;
	data: T;
}

export interface Drawable<T, U> {
	tick?(timestamp: number): void;
	draw(ctx: CanvasRenderingContext2D, slot?: CardSlot<U>, position?: Position): void;
	getPosition(): Position;

	onMouseMove?(position: Position): void;
	onMouseLeftClick?(position: Position): Action<T>;
	onMouseLeftClickRelease?(position: Position): Action<T>;
}

export class TextLabel<T, U> implements Drawable<T, U> {
	position: Position;
	text: string;

	constructor(position: Position, text: string, cardSize: Size, ctx: CanvasRenderingContext2D) {
		this.position = position;

		ctx.fillStyle = "#fff";
		ctx.font = `21px sans-serif`;
		const textMetrics = ctx.measureText(text);
		const centerX = cardSize.width / 2 - textMetrics.width / 2;
		this.position.x += centerX;

		this.text = text;
	}

	draw(ctx: CanvasRenderingContext2D, slot: CardSlot<U>, position?: Position): void {
		ctx.fillStyle = "#fff";
		ctx.font = `21px sans-serif`;
		ctx.textAlign = "left";
		ctx.textBaseline = "bottom";
		ctx.fillText(
			this.text,
			slot.coord.x + (position?.x ?? 0) + this.position.x,
			slot.coord.y + (position?.y ?? 0) + this.position.y
		);
	}

	getPosition(): Position {
		return this.position;
	}
}
