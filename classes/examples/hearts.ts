import { CardLibrary, Deck } from "../card-lib.js";
import { Card  } from "../card.js";
import { Fan } from "../containers/fan.js";
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
			const playerArea = new Fan(
				{width: game.canvas.width, height: game.canvas.height},
				this.getHandPosition(game, i)
			);
			playerArea.maxCards = handSize;
			game.registerContainer(`player${i}`, playerArea); 
			playerArea.setCards(playerCards);
			
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

	getHandPosition(game: Game, index: number): Position {
		switch (index) {
			case 0: return {x: 0, y: game.canvas.height/2 - 50};
			case 1: return {x: game.canvas.width/2 - 100, y: 0};
			case 2: return {x: 0, y: -game.canvas.height/2 + 200};
			case 3: return {x: -game.canvas.width/2 + 100, y: 0};
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
	static of(library: CardLibrary, players?: number): HeartsDeck {
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
