import { CardProducer, Deck } from "../card-lib.js";
import { Card } from "../card.js";
import { Cards } from "../cards.js";
import { Game, Position } from "../game.js";
import { Layouts } from "../layouts.js";
import { Rules } from "../rules.js";

export class HeartsRules implements Rules {
	players: number = 4;
	currentTrick: Record<number, Card> = {};

	startingPlayer: number = -1;
	currentPlayer: number = 0;

	locked: boolean = false;
	deck?: HeartsDeck;

	init(game: Game): void {
		this.deck = HeartsDeck.of(game.cardLib, this.players);
		Layouts.setTrickTakingLayout(game, {players: this.players, deckSize: this.deck.size(), experimentalPlacementAlgorithm: true});
		this.newDeal(game);
	}

	newDeal(game: Game) {
		if (!this.deck) return;
		const deck = this.deck.clone();
		deck.shuffle();
		Layouts.dealTrickTaking(game, deck, {players: this.players});

		this.startingPlayer = (this.startingPlayer + 1) % this.players;
		this.currentPlayer = this.startingPlayer;
		this.newTrick(game);
	}

	newTrick(game: Game) {
		this.currentTrick = {};
		game.getContainer("trick")?.clear(true);
		this.currentPlayer = this.startingPlayer;

		while (this.currentPlayer != 0) {
			this.randomPlayer(game, this.currentPlayer);
			this.currentPlayer += 1;
			this.currentPlayer = this.currentPlayer % this.players;
		}
	}

	onCardClick(game: Game, card: Card, _coord?: Position): void {
		if (this.locked) return;

		const legal = this.getLegalCards(game, 0);
		const isCardLegal = legal.some((c) => c === card.name);
		if (!isCardLegal) return;

		this.playCard(game, 0, card);

		const alreadyPlayed = this.currentTrick[0] !== undefined;
		if (!alreadyPlayed) return;


		this.currentPlayer += 1;
		this.currentPlayer = this.currentPlayer % this.players;
		while (this.currentPlayer != this.startingPlayer) {
			this.randomPlayer(game, this.currentPlayer);
			this.currentPlayer += 1;
			this.currentPlayer = this.currentPlayer % this.players;
		}

		this.startingPlayer = this.getTrickWinner();
		console.log(`Trick winner is player${this.startingPlayer}`);

		this.locked = true;
		game.addEvent(() => this.onTrickEnd(game), 1000);
	}

	onTrickEnd(game: Game) {
		this.locked = false;
		const playerHand = game.getContainer("player0");
		const dealFinished = playerHand && playerHand.getCards().length === 0;
		if (dealFinished) this.newDeal(game);
		else this.newTrick(game);
	}

	getLegalCards(game: Game, player: number) {
		const playerHand = game.getContainer(`player${player}`);
		if (!playerHand) return [];

		let cards = playerHand.getCards().map((c) => c.name);

		const suit = this.currentTrick[this.startingPlayer];
		if (suit) {
			const playersCardsInSuit = cards
				.filter((c) => Cards.getSuit(c) === Cards.getSuit(suit));
			if (playersCardsInSuit.length > 0) cards = playersCardsInSuit;
		}
		return cards;
	}

	getTrickWinner(): number {
		const leadingCard = this.currentTrick[this.startingPlayer];
		if (!leadingCard) return -1;
		const suit = Cards.getSuit(leadingCard);
		const cards = Object.values(this.currentTrick)
			.map(c => c.name);
		const winningCard = Cards.getStrongestCard(cards, suit);
		console.log(winningCard);

		for (let i = 0; i < this.players; i++) {
			if (this.currentTrick[i].name === winningCard) return i;
		}

		return 0;
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

		const legal = this.getLegalCards(game, player);
		const idx = Math.floor(Math.random() * legal.length);
		const card = playerHand.getCards().find((c) => c.name === legal[idx]);
		if (!card) return;
		this.playCard(game, player, card);
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
