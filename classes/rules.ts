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

export class DebugRules implements Rules {
	init(game: Game): void {
		game.setGridSize({width: 5, height: 5});
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
