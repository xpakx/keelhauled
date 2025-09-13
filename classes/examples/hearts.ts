import { CardProducer, Deck } from "../card-lib.js";
import { Card } from "../card.js";
import { Game, Position } from "../game.js";
import { Layouts } from "../layouts.js";
import { Rules } from "../rules.js";

export class HeartsRules implements Rules {
	players: number = 4;
	currentTrick: Record<number, Card> = {};

	init(game: Game): void {
		Layouts.setTrickTakingLayout(game, this.players);
		const deck = HeartsDeck.of(game.cardLib, this.players);
		deck.shuffle();
		Layouts.dealTrickTaking(game, this.players, deck);
		this.newTrick(game);
	}

	newTrick(game: Game) {
		this.currentTrick = {};
		game.getContainer("trick")?.clear(true);
	}

	onCardClick(game: Game, card: Card, _coord?: Position): void {
		this.playCard(game, 0, card);

		const alreadyPlayed = this.currentTrick[0] !== undefined;
		if (!alreadyPlayed) return;
		// TODO
		this.randomPlayer(game, 1);
		this.randomPlayer(game, 2);
		this.randomPlayer(game, 3);

		setTimeout(() => {
			this.newTrick(game);
		}, 1000);
	}

	private playCard(game: Game, player: number, card: Card) {
		const alreadyPlayed = this.currentTrick[player] !== undefined;
		if (alreadyPlayed) return;
		const playerName = `player${player}`;

		if (game.moveCard(card, playerName, "trick")) {
			this.currentTrick[player] = card;
			card.flipped = true;
			console.log(`Player ${player} played ${card.name}`);
		}

	}

	private randomPlayer(game: Game, player: number) {
		const playerName = `player${player}`;
		const playerHand = game.getContainer(playerName);
		if (!playerHand) return;

		const cards = playerHand.getCards();
		const idx = Math.floor(Math.random() * cards.length);
		this.playCard(game, player, cards[idx]);
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
