import { Assets } from "../assets.js";
import { CardLibrary } from "../card-lib.js";
import { Card  } from "../card.js";
import { Grid } from "../containers/grid.js";
import { Game, Position, Size } from "../game.js";
import { CardLoader, DefaultCardLoader, Rules } from "../rules.js";

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
