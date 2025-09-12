import { CardProducer, Deck } from "../card-lib.js";
import { Card } from "../card.js";
import { Stack } from "../containers/stack.js";
import { Game, Position } from "../game.js";
import { Rules } from "../rules.js";

export class HeartsRules implements Rules {
	players: number = 4;
	currentTrick: Record<number, Card> = {};

	init(game: Game): void {
		const deck = HeartsDeck.of(game.cardLib, this.players);
		deck.shuffle();

		const handSize = this.getHandSize();
		for (let i = 0; i < this.players; i++) {

			const playerCards = deck.drawCards(handSize);
			const playerArea = new Stack(
				this.getHandWidth(),
				playerCards[0].size,
				{
					position: this.getHandPosition(game, i),
					orientation: i%2 == 0 ? "horizontal" : "vertical",
					idealHandLength: this.getHandSize(),
				}
			);
			game.registerContainer(`player${i}`, playerArea); 
			playerArea.setCards(playerCards, {flipped: i === 0});
			let cardNum = 0;
			for (let card of playerArea.cards) {
				const delay = (cardNum*this.players + i)*50;
				card.getCard()?.deal({x: -card.coord.x + game.canvas.width/2, y: -card.coord.y + game.canvas.height/2}, delay);
				cardNum += 1;
			}
			
		}
		const trickWidth = 3 * 25 + game.cardLib.getDefaultSize().width;
		const trick = new Stack(
			trickWidth,
			game.cardLib.getDefaultSize(),
			{
				idealHandLength: 4,
				position:  { 
					x: game.canvas.width/2 - trickWidth/2,
					y: game.canvas.height/2 - game.cardLib.getDefaultSize().height/2
				}
			}
		);
		game.registerContainer(`trick`, trick); 
		this.newTrick(game);
	}

	newTrick(game: Game) {
		this.currentTrick = {};
		const trick = game.getContainer("trick") as Stack<unknown> | undefined;
		if (trick) trick.cards = [];
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
		const playerHand = game.getContainer(playerName) as Stack<unknown> | undefined;
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
