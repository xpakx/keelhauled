import { Deck } from "./card-lib.js";
import { Stack } from "./containers/stack.js";
import { Game, Position } from "./game.js";

export class Layouts {

	constructor() {
		throw new Error('Layouts is a static class and cannot be instantiated');
	}

	static setTrickTakingLayout(game: Game, players: number = 4)  {
		const handSize = 13; // TODO: deck.len/players
		const handWidth = (handSize-1) * 25 + game.cardLib.getDefaultSize().width;
		for (let i = 0; i < players; i++) {

			const playerArea = new Stack(
				handWidth,
				game.cardLib.getDefaultSize(),
				{
					position: Layouts.getHandPosition(game, i, handWidth),
					orientation: i%2 == 0 ? "horizontal" : "vertical",
					idealHandLength: handSize,
				}
			);
			game.registerContainer(`player${i}`, playerArea); 
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
	}

	static dealTrickTaking(game: Game, players: number = 4, deck: Deck)  {
		const handSize = 13; // TODO: deck.len/players
		for (let i = 0; i < players; i++) {
			const playerArea = game.getContainer(`player${i}`) as Stack<unknown> | undefined; 
			if (!playerArea) continue;
			const playerCards = deck.drawCards(handSize);
			playerArea.setCards(playerCards, {flipped: i === 0});
			let cardNum = 0;
			for (let card of playerArea.cards) {
				const delay = (cardNum*players + i)*50;
				card.getCard()?.deal({x: -card.coord.x + game.canvas.width/2, y: -card.coord.y + game.canvas.height/2}, delay);
				cardNum += 1;
			}
			
		}
	}

	private static getHandPosition(game: Game, index: number, handWidth: number): Position {
		const padding = 20;
		const cardHeight = game.cardLib.getDefaultSize().height;
		const cardWidth = game.cardLib.getDefaultSize().width;
		switch (index) {
			case 0: return {
				x: game.canvas.width/2 - handWidth/2 - cardWidth/2,
				y: game.canvas.height - cardHeight - padding
			};
			case 1: return {
				x: game.canvas.width - cardWidth - padding,
				y: game.canvas.height/2 - handWidth/2 - cardHeight/2
			};
			case 2: return {
				x: game.canvas.width/2 - handWidth/2 - cardWidth/2,
				y: padding
			};
			case 3: return {
				x: padding, 
				y: game.canvas.height/2 - handWidth/2 - cardHeight/2
			};
			default: return {x: 0, y: 0}
		}
		
	}
}
