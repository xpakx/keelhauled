import { CardLibrary, Deck } from "../card-lib.js";
import { Card  } from "../card.js";
import { Game, Position } from "../game.js";
import { Rules } from "../rules.js";

export class HeartsRules implements Rules {
	players: number = 4;

	init(game: Game): void {
		const deck = HeartsDeck.of(game.cardLib, this.players);
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
