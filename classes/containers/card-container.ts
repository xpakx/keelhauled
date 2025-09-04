import { Card } from "../card.js";
import { Position } from "../game.js";

export interface CardContainer {
	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D): void;
	onMouseMove(position: Position): void;
	onMouseLeftClick(position: Position): Card | undefined;
	onMouseLeftClickRelease(position: Position): void;
	getCards(): Card[];
}

