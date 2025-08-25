import { Card } from "./card.js";
import { Position, Size } from "./game";

export class Hand {
	cards: Card[] = [];
	position: Position = {x: 0, y: 0};
	size: Size = {height: 120, width: 800};

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
			card.draw(ctx, {
				x: i*100,
				y: 0,
			});
			i++;
		}
		ctx.restore();
	}
}
