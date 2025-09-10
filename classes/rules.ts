import { Assets } from "./assets.js";
import { CardLibrary, Deck } from "./card-lib.js";
import { Card, CardSlot } from "./card.js";
import { Fan } from "./containers/fan.js";
import { Grid } from "./containers/grid.js";
import { Action } from "./drawable.js";
import { Game, Position, Size } from "./game.js";

export interface Rules {
	init(game: Game): void;
	onCardClick?(game: Game, slot: Card, coord?: Position): void;
	onSlotClick?(game: Game, slot: CardSlot<any>, coord?: Position): void;
	isGameOver(game: Game): boolean;
	/** @deprecated Use containers' setCards instead */ drawCard?(): string | undefined;
	getScore?(): number;
	getState?(): string;
	onGameOver?(game: Game): void;
	onInterfaceClick?(game: Game, action: Action<any>, coord?: Position): void;
}

export interface CardLoader {
	load(cardLib: CardLibrary): Promise<undefined>;
}

export class DebugRules implements Rules {
	cards: string[] = [];

	init(game: Game): void {
		const deck: Deck = game.cardLib.toDeck();
		deck.shuffle();

		const fan = new Fan(
			{width: game.canvas.width, height: game.canvas.height},
			{x: 0, y: game.canvas.height/2 - 30}
		);
		game.registerContainer("hand", fan);
		const cards: Card[] = [];
		for (let i = 0; i < 10; i++) {
			cards.push(deck.draw()!);
		}
		fan.setCards(cards);

		this.cards = deck.cards;
		const grid = new Grid();
		game.registerContainer("grid", grid);
		grid.setGridSize(
			{width: 4, height: 4},
			{width: game.canvas.width, height: game.canvas.height},
			game.cardLib,
			this,
		);
	}

	onCardClick(_game: Game, card: Card, _coord?: Position): void {
		console.log(`Card ${card.name} clicked`);
		card.revealCard();
	}

	isGameOver(_game: Game): boolean {
		return false;
	}

	getScore?(): number {
		return 0;
	}

	drawCard(): string | undefined {
	    return this.cards.pop();
	}
}

export class DefaultCardLoader implements CardLoader {
	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await Assets.loadImage("images/card.png");
		const faceImage = await Assets.loadImage("images/empty.png");
		cardLib.setDefaultReverse(cardImage);
		cardLib.registerDefinition("empty", faceImage);
	}
}




export class TraditionalDeckCardLoader extends DefaultCardLoader implements CardLoader {

	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await Assets.loadImage("images/trad/card.png");
		const background = await Assets.loadImage("images/trad/card.png");
		const frame = await Assets.loadImage("images/trad/frame.png");
		cardLib.setDefaultReverse(cardImage);
		const size: Size = {width: 80, height: 100};
		cardLib.setDefaultSize(size);

		const suits = ["C", "H", "S", "D"];
		const ranks = ["K", "Q", "J", "A", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
		const sprites = await Assets.loadImage("images/trad/sprites.png");
		const images = await Assets.splitGridImage(sprites, 3, 8);
		console.log(images);

		let index = 0;
		const suitImages: Record<string, HTMLImageElement> = {};
		for (let suit of suits) suitImages[suit] = images[index++];

		const rankImages: Record<string, HTMLImageElement> = {};
		for (let rank of ranks) rankImages[rank] = images[index++];

		for (let suit of suits) {
			for (let rank of ranks) {
				const image = this.createCardImage(
					background,
					frame,
					suitImages[suit],
					rankImages[rank],
					size,
				);
				cardLib.registerDefinition(`${rank}${suit}`, image);
			}
		}
	}

	createCardImage(
		background: HTMLImageElement,
		frame: HTMLImageElement,
		suit: HTMLImageElement,
		rank: HTMLImageElement,
		size: Size,
	): HTMLImageElement {
		const canvas = new OffscreenCanvas(size.width, size.height);
		canvas.width = size.width;
		canvas.height = size.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2D context!");

		ctx.drawImage(background, 0, 0, size.width, size.height);

		// TODO: main image

		ctx.drawImage(frame, 0, 0, size.width, size.height);

		const rankSize = size.width * 0.2;
		ctx.drawImage(rank, 8, 7, rankSize, rankSize);

		const suitSize = size.width * 0.18;
		ctx.drawImage(suit, 8, rankSize + 7, suitSize, suitSize);

		ctx.save();
		ctx.translate(size.width, size.height);
		ctx.rotate(Math.PI);
		ctx.drawImage(rank, 8, 7, rankSize, rankSize);
		ctx.drawImage(suit, 8, rankSize + 7, suitSize, suitSize);
		ctx.restore();


		const img = new Image();
		canvas.convertToBlob().then(blob => {
			const url = URL.createObjectURL(blob);
			img.src = url;
		});

		return img;
	}
}
