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

export interface InterfaceDrawable<T> {
	tick?(timestamp: number): void;
	draw(ctx: CanvasRenderingContext2D, position?: Position): void;
	getPosition(): Position;

	onMouseMove?(position: Position): void;
	onMouseLeftClick?(position: Position): Action<T> | undefined;
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

export class Button<T> implements InterfaceDrawable<T> {
	position: Position;
	size: Size;
	action: Action<T>;
	hovered: boolean = false;
	radius: number;

	constructor(position: Position, action: Action<T>, size: Size) {
		this.position = position;
		this.size = size;
		this.radius = size.width/2;
		this.action = action;
	}

	draw(ctx: CanvasRenderingContext2D, position?: Position): void {
		ctx.fillStyle = this.hovered ? "red" : "blue";
		ctx.beginPath();
		ctx.arc(
			this.position.x + (position?.x ?? 0) + this.radius,
			this.position.y + (position?.y ?? 0) + this.radius,
			this.radius,
			0,
			2 * Math.PI
		);
		ctx.fill();
	}

	private isHovered(position: Position): boolean {
		if (position.x < this.position.x || position.x > this.position.x + this.size.width) return false;
		if (position.y < this.position.y || position.y > this.position.y + this.size.height) return false;
		return true;
	}

	onMouseMove(position: Position): void {
		if (this.isHovered(position)) this.hovered = true;
		else this.hovered = false;
	}

	onMouseLeftClick(position: Position): Action<T> | undefined {
		if (!this.isHovered(position)) return
		return this.action;
	}

	getPosition(): Position {
		return this.position;
	}
}
