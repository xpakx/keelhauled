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


export class PairsMemoryGameRules implements Rules {
	private firstSelection: Card | null = null;
	private secondSelection: Card | null = null;
	private locked: boolean = false;
	private moves: number = 0;
	private pairsFound: number = 0;
	private size: Size = {width: 4, height: 4};

	init(game: Game): void {
		const totalCards = this.size.width * this.size.height;
		const pairsNeeded = totalCards / 2;

		const deck = game.cardLib.toDeck();
		deck.shuffle();
		const cardsInGame = deck.subdeck(pairsNeeded, {shuffled: true, doubled: true});

		const grid = new Grid();
		game.registerContainer("grid", grid);
		grid.setGridSize(
			{width: 4, height: 4},
			{width: game.canvas.width, height: game.canvas.height},
			game.cardLib,
			this,
		);
		grid.setCards(cardsInGame.getCards());
	}

	onCardClick(game: Game, card: Card, _coord?: Position): void {
		if (this.locked || !card.safeToFlip()) return;

		card.revealCard();
		this.moves++;
		console.log(`${card.name} revealed`);

		if (!this.firstSelection) {
			this.firstSelection = card;
		} else if (!this.secondSelection) {
			if (this.firstSelection === card) return;
			this.secondSelection = card;
			this.checkMatch(game);
		}
	}

	private checkMatch(_game: Game): void {
		if (!this.firstSelection || !this.secondSelection) return;
		this.locked = true;

		const first = this.firstSelection;
		const second = this.secondSelection;
		console.log(`comparing ${first.name} and ${second.name}`);

		const match = first.name === second.name;
		if (match) {
			this.pairsFound++;
			this.firstSelection = null;
			this.secondSelection = null;
			this.locked = false;
		} else {
			setTimeout(() => {
				first.flipCard();
				second.flipCard();
				this.firstSelection = null;
				this.secondSelection = null;
				this.locked = false;
			}, 1000);
		}

	}

	isGameOver(game: Game): boolean {
		const grid = game.getContainer("grid");
		if (!grid) return false;
		return !this.locked && grid.getCards().every(c => c.flipped);
	}

	getScore(): number {
		return this.moves;
	}

	getState(): string {
		return `Moves: ${this.moves}, Pairs found: ${this.pairsFound}`;
	}

	onGameOver(game: Game): void {
		this.locked = true;
		const grid = game.getContainer("grid");
		if (!grid) return;

		setTimeout(() => {
			grid.getCards().forEach(c => c.flipCard());
			setTimeout(() => {
				this.init(game);
				const grid = game.getContainer("grid");
				if (!grid) return;
				grid.getCards().forEach(c => {
					c.animation = undefined;
					c.dealt = true
				});
				this.locked = false;
			}, 300);
		}, 500);
	}
}


export class PairGameCardLoader extends DefaultCardLoader implements CardLoader {
	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await Assets.loadImage("images/card.png");
		const faceImage = await Assets.loadImage("images/empty.png");
		cardLib.setDefaultReverse(cardImage);
		cardLib.registerDefinition("empty", faceImage);

		const colors = ["red", "blue", "green", "yellow", "magenta", "cyan", "black", "gray"];
		for (let color of colors) {
			const image = this.createCardImage(
				faceImage,
				color,
			);
			cardLib.registerDefinition(color, image);
		}
	}


	createCardImage(
		emptyCard: HTMLImageElement,
		color: string = "#000000",
	): HTMLImageElement {
		const canvas = new OffscreenCanvas(emptyCard.width, emptyCard.height);
		canvas.width = emptyCard.width;
		canvas.height = emptyCard.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2D context!");

		ctx.drawImage(emptyCard, 0, 0, canvas.width, canvas.height);

		ctx.fillStyle = color;
		const padding = 0.105 * canvas.width;
		const radius = 0.12 * canvas.width;
		ctx.beginPath();
		ctx.roundRect(
			padding, 
			padding,
			canvas.width - 2*padding,
			canvas.height - 2*padding,
			radius
		);
		ctx.fill();

		const img = new Image();
		canvas.convertToBlob().then(blob => {
			const url = URL.createObjectURL(blob);
			img.src = url;
		});

		return img;
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
