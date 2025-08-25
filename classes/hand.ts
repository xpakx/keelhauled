import { Card } from "./card.js";
import { Position, Size } from "./game";

export class Hand {
	cards: Card[] = [];
	position: Position = {x: 0, y: 0};
	size: Size = {height: 120, width: 800};
	selectedCard: Card | undefined;
	selectionPosition: Position = {x: 0, y: 0};
	dragging: boolean = false;

	realSize: Size = {height: 120, width: 800};
	
	calculatePosition(canvasSize: Size) {
		const widthMargin = Math.abs((this.size.width - canvasSize.width)/2)
		this.position.x = widthMargin;
		this.position.y = canvasSize.height - this.size.height;
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.drawCards(ctx);
	}

	addCard(card: Card) {
		card.flipped = true;
		card.dealt = true;
		this.cards.push(card);
		this.calculateRealHandSize();
	}

	calculateRealHandSize() {
		let cardsLength = 0;
		for (let card of this.cards) cardsLength += card.size.width;
		this.realSize.width = cardsLength;
	}

	drawCards(ctx: CanvasRenderingContext2D) {
		ctx.save();
		const padding = Math.abs((this.realSize.width - this.size.width)/2)
		ctx.translate(this.position.x + padding, this.position.y);
		let i = 0;
		for (let card of this.cards) {
			if (this.dragging && card == this.selectedCard) continue;
			card.draw(ctx, {
				x: i*100,
				y: 0,
			});
			i++;
		}
		ctx.restore();
	}

	tick(timestamp: number, position: Position) {
		for (let card of this.cards) card.tick(timestamp, false);

		if (this.selectedCard && this.distance(position, this.selectionPosition) > 10) this.dragging = true;
	}

	distance(p1: Position, p2: Position): number {
		return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
	}

	onMouseLeftClick(position: Position) {
		const padding = Math.abs((this.realSize.width - this.size.width)/2) + this.position.x;
		for (let i = 0; i < this.cards.length; i++) {
			const card = this.cards[i];
			const xStart = this.position.x + padding + i*100;
			const yStart = this.position.y;
			const xEnd = xStart + card.size.width;
			const yEnd = yStart + card.size.height;
			if (xStart <= position.x && position.x <= xEnd && yStart <= position.y && position.y <= yEnd) {
				this.selectedCard = card;
				this.selectionPosition.x = position.x;
				this.selectionPosition.y = position.y;
			}
		}
	}

	onLeftMouseClickRelease(_position: Position) {
		if (!this.dragging) this.selectedCard?.flipCard();
		this.dragging = false;
		this.selectedCard = undefined;
	}
}
