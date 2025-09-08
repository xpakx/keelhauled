import { CardSlot } from "./card";
import { Position } from "./game";

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
