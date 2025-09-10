import { CardProducer, Deck } from "../card-lib.js";
import { Card  } from "../card.js";
import { Stack } from "../containers/stack.js";
import { Game, Position } from "../game.js";
import { Rules } from "../rules.js";

export class HeartsRules implements Rules {
	players: number = 4;

	init(game: Game): void {
		const deck = HeartsDeck.of(game.cardLib, this.players);
		deck.shuffle();

		const handSize = this.getHandSize();
		for (let i = 0; i < this.players; i++) {

			const playerCards = deck.drawCards(handSize);
			const playerArea = new Stack(
				this.getHandWidth(),
				{
					position: this.getHandPosition(game, i),
					orientation: i%2 == 0 ? "horizontal" : "vertical"
				}
			);
			game.registerContainer(`player${i}`, playerArea); 
			playerArea.setCards(playerCards, i === 0);
			
		}
	}

	getHandSize(): number {
		switch (this.players) {
			case 3: return 17;
			case 5: return 10;
			case 6: return 8;
			default: return 13;
		}
	}

	getHandWidth(): number {
		return this.getHandSize() * 25;
	}

	getHandPosition(game: Game, index: number): Position {
		const padding = 20;
		const cardHeight = game.cardLib.getDefaultSize().height;
		const cardWidth = game.cardLib.getDefaultSize().width;
		switch (index) {
			case 0: return {
				x: game.canvas.width/2 - this.getHandWidth()/2 - cardWidth/2,
				y: game.canvas.height - cardHeight - padding
			};
			case 1: return {
				x: game.canvas.width - cardWidth - padding,
				y: game.canvas.height/2 - this.getHandWidth()/2 - cardHeight/2
			};
			case 2: return {
				x: game.canvas.width/2 - this.getHandWidth()/2 - cardWidth/2,
				y: padding
			};
			case 3: return {
				x: padding, 
				y: game.canvas.height/2 - this.getHandWidth()/2 - cardHeight/2
			};
			default: return {x: 0, y: 0}
		}
		
	}

	onCardClick(_game: Game, _card: Card, _coord?: Position): void {
	}

	isGameOver(_game: Game): boolean {
		return false;
	}

	getScore(): number {
		return 0;
	}

	getState(): string {
		return "";
	}

	onGameOver(_game: Game): void {
	}
}

class HeartsDeck extends Deck {
	static of(library: CardProducer, players?: number): HeartsDeck {
		const deck = new HeartsDeck(library);
		if (players !== undefined) deck.removeCards(players);
		return deck;
	}

	removeCards(players: number) {
		if (players < 3 || players > 6) throw new Error("Illegal number of players!");
		const removals: Record<number, string[]> = {
			3: ["2C"],
			5: ["2C", "2D"],
			6: ["2C", "2D", "3C", "2S"],
		};
		const toRemove = removals[players];
		if (!toRemove) return;

		toRemove.forEach(card => this.removeCard(card));
	}
}
