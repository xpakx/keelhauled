import { CardLibrary } from "./card-lib.js";
import { Card } from "./card.js";
import { Game, Position, Size } from "./game.js";

export interface Rules {
	init(game: Game): void;
	onCardClick(game: Game, card: Card, coord?: Position): void;
	isGameOver(game: Game): boolean;
	drawCard(): string | undefined;
	getScore?(): number;
	getState?(): string;
}

export interface CardLoader {
	load(cardLib: CardLibrary): Promise<undefined>;
}

export class DebugRules implements Rules {
	init(game: Game): void {
		game.setGridSize({width: 5, height: 5});
		game.__debugAddHand();
	}

	onCardClick(_game: Game, card: Card, _coord?: Position): void {
		card.revealCard();
	}

	isGameOver(_game: Game): boolean {
		return false;
	}

	getScore?(): number {
		return 0;
	}

	drawCard(): string | undefined {
	    return "empty";
	}
}

export class DefaultCardLoader implements CardLoader {
	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await this.loadImage("images/card.png");
		const faceImage = await this.loadImage("images/empty.png");
		cardLib.setDefaultReverse(cardImage);
		cardLib.registerDefinition("empty", faceImage);
	}

	async loadImage(url: string): Promise<HTMLImageElement> {
		const image = new Image();
		image.src = url;
		return new Promise((resolve, reject) => {
			image.onload = () => resolve(image);
			image.onerror = reject;
		});
	}
}


export class PairsMemoryGameRules implements Rules {
	private firstSelection: Card | null = null;
	private secondSelection: Card | null = null;
	private locked: boolean = false;
	private score: number = 0;
	private cardsInGame: string[] = [];
	private size: Size = {width: 4, height: 4};

	init(game: Game): void {
		const totalCards = this.size.width * this.size.height;
		const pairsNeeded = totalCards / 2;

		const keys = game.cardLib.getKeys().filter(c => c != "empty");
		const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
		const chosen = shuffledKeys.slice(0, pairsNeeded);
		this.cardsInGame = [...chosen, ...chosen];
		this.cardsInGame.sort(() => Math.random() - 0.5);

		game.setGridSize({width: this.size.width, height: this.size.height});
	}

	onCardClick(game: Game, card: Card, _coord?: Position): void {
		if (this.locked || card.flipped) return;

		card.revealCard();
		console.log(`${card.name} revealed`);

		if (!this.firstSelection) {
			this.firstSelection = card;
		} else if (!this.secondSelection) {
			this.secondSelection = card;
			this.checkMatch(game);
		}
	}

	private checkMatch(_game: Game): void {
		if (!this.firstSelection || !this.secondSelection) return;
		this.locked = true;

		const first = this.firstSelection;
		const second = this.secondSelection;

		const match = first.name === second.name;
		if (match) {
			this.score++;
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
		return !this.locked && game.cards.every(c => c.card.flipped);
	}

	getScore(): number {
		return this.score;
	}

	getState(): string {
		return `Score: ${this.score}, Pairs found: ${this.score}`;
	}

	drawCard(): string | undefined {
		return this.cardsInGame.pop();
	}

}


export class PairGameCardLoader extends DefaultCardLoader implements CardLoader {
	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await this.loadImage("images/card.png");
		const faceImage = await this.loadImage("images/empty.png");
		cardLib.setDefaultReverse(cardImage);
		cardLib.registerDefinition("empty", faceImage);

		const colors = ["red", "blue", "green", "yellow", "magenta", "cyan", "black", "gray"];
		for (let color of colors) {
			const image = this.createCardImage(
				faceImage,
				{width: 100, height: 100},
				color,
			);
			cardLib.registerDefinition(color, image);
		}
	}


	createCardImage(
		emptyCard: HTMLImageElement,
		size: Size,
		color: string = "#000000",
	): HTMLImageElement {
		const canvas = new OffscreenCanvas(size.width, size.height);
		canvas.width = size.width;
		canvas.height = size.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2D context!");

		ctx.drawImage(emptyCard, 0, 0, size.width, size.height);

		ctx.fillStyle = color;
		ctx.fillRect(10, 10, size.width - 20, size.height - 20);

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
		const cardImage = await this.loadImage("images/trad/card.png");
		const background = await this.loadImage("images/trad/card.png");
		const frame = await this.loadImage("images/trad/frame.png");
		cardLib.setDefaultReverse(cardImage);
		const size: Size = {width: 80, height: 100};
		cardLib.setDefaultSize(size);

		const suits = ["H", "D", "C", "S"];
		const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

		const suitImages: Record<string, HTMLImageElement> = {};
		for (let suit of suits) {
			const suitImage = await this.loadImage(`images/trad/${suit}.png`);
			suitImages[suit] = suitImage;
		}

		const rankImages: Record<string, HTMLImageElement> = {};
		for (let rank of ranks) {
			const rankImage = await this.loadImage(`images/trad/${rank}.png`);
			rankImages[rank] = rankImage;
		}

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
		ctx.drawImage(rank, 5, 6, rankSize, rankSize);

		const suitSize = size.width * 0.18;
		ctx.drawImage(suit, 5, rankSize + 5, suitSize, suitSize);

		ctx.save();
		ctx.translate(size.width, size.height);
		ctx.rotate(Math.PI);
		ctx.drawImage(rank, 5, 6, rankSize, rankSize);
		ctx.drawImage(suit, 5, rankSize + 5, suitSize, suitSize);
		ctx.restore();


		const img = new Image();
		canvas.convertToBlob().then(blob => {
			const url = URL.createObjectURL(blob);
			img.src = url;
		});

		return img;
	}
}
