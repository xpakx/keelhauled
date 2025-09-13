import { Card, CardSlot } from "../card.js";
import { Position } from "../game.js";

export interface CardContainer<T> {
	nextFrame(timestamp: number, ctx: CanvasRenderingContext2D): void;
	onMouseMove(position: Position): void;
	onMouseLeftClick(position: Position): CardSlot<T> | undefined;
	onMouseLeftClickRelease(position: Position): void;
	getCards(): Card[];
	setCards(cards: Card[], opt?: CardsSettingOptions): void;
	removeCard(card: Card | string): CardSlot<T> | undefined;
	addCard(card: Card | CardSlot<T>): void;
	clear(removeSlots?: boolean): void;
}

export interface CardsSettingOptions {
	flipped?: boolean;
}

