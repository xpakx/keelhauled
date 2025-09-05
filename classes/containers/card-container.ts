import { Card, CardSlot } from "../card.js";
import { Position } from "../game.js";

export interface CardContainer<T> {
	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D): void;
	onMouseMove(position: Position): void;
	onMouseLeftClick(position: Position): CardSlot<T> | undefined;
	onMouseLeftClickRelease(position: Position): void;
	getCards(): Card[];
}

