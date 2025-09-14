import { Deck } from "./card-lib.js";
import { Anchor, Stack } from "./containers/stack.js";
import { Game, Position, Size } from "./game.js";

export interface LayoutOptions {
	players?: number;
	deckSize?: number;
	handSize?: number;
	experimentalPlacementAlgorithm?: boolean;
}

export interface DealOptions {
	players?: number;
	handSize?: number;
}

export class Layouts {

	constructor() {
		throw new Error('Layouts is a static class and cannot be instantiated');
	}

	static setTrickTakingLayout(game: Game, opt?: LayoutOptions)  {
		const players = opt?.players ?? 4;
		const handSize = opt?.handSize ?? (opt?.deckSize ? Math.floor(opt.deckSize/players): 13);
		const handWidth = (handSize-1) * 25 + game.cardLib.getDefaultSize().width;
		for (let i = 0; i < players; i++) {

			const playerArea = new Stack(
				handWidth,
				game.cardLib.getDefaultSize(),
				{
					position: opt?.experimentalPlacementAlgorithm 
						? Layouts.getHandPositionExperimental(game, i, handWidth, players)
						: Layouts.getHandPosition(game, i, handWidth, players),
					orientation: this.getOrientation(players, i),
					idealHandLength: handSize,
					anchor: opt?.experimentalPlacementAlgorithm ? "center" : undefined,
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

	private static getOrientation(players: number, index: number): "horizontal" | "vertical" {
		switch(players) {
			case 5:
			case 3: return index === 0 ? "horizontal" : "vertical";
			case 6: return index === 0 || index === 3 ? "horizontal" : "vertical";
			case 4: return index%2 === 0 ? "horizontal" : "vertical";
			default:
				return "horizontal"
		}
	}

	static dealTrickTaking(game: Game, deck: Deck, opt?: DealOptions)  {
		const players = opt?.players ?? 4;
		const handSize = opt?.handSize ?? Math.floor(deck.size()/players);
		for (let i = 0; i < players; i++) {
			const playerArea = game.getContainer(`player${i}`) as Stack<unknown> | undefined; 
			if (!playerArea) continue;
			const playerCards = deck.drawCards(handSize);
			playerArea.setCards(playerCards, {flipped: i === 0});
			let cardNum = 0;
			for (let card of playerArea.cards) {
				const delay = (cardNum*players + i)*50;
				card.getCard()?.deal({
					x: game.canvas.width/2 - card.coord.x - game.cardLib.getDefaultSize().width/2,
					y: game.canvas.height/2 - card.coord.y - game.cardLib.getDefaultSize().height/2
				}, delay);
				cardNum += 1;
			}
			
		}
	}

	private static getHandPosition(game: Game, index: number, handWidth: number, _players: number): Position {
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

	private static getHandPositionExperimental(game: Game, index: number, _handWidth: number, players: number): Position {
		return Layouts.getRegularPolygon(
			{width: game.canvas.width, height: game.canvas.height},
			players,
			250,
			index,
		);
	}


	static getRegularPolygon(canvasSize: Size, n: number, r: number, i: number): Position {
		const cx = canvasSize.width / 2;
		const cy = canvasSize.height / 2;

		const step = (2 * Math.PI) / n;

		const startAngle = Math.PI / 2;

		const angle = startAngle + i * step;
		const x = cx + r * Math.cos(angle);
		const y = cy + r * Math.sin(angle);

		return { x, y };
	}

	static adjustToAnchor(size: Size, anchor: Anchor): Position {
		switch(anchor) {
			case "center":
				return {x: size.width/2, y: size.height/2}
			case "top":
				return {x: size.width/2, y: 0}
			case "rightTop":
				return {x: size.width, y: 0}
			case "right":
				return {x: size.width, y: size.height/2}
			case "rightBottom":
				return {x: size.width, y: size.height}
			case "bottom":
				return {x: size.width/2, y: size.height}
			case "leftBottom":
				return {x: 0, y: size.height}
			case "left":
				return {x: 0, y: size.height/2}
			case "leftTop":
			default:
				return {x: 0, y: 0}
		}
	}
}
