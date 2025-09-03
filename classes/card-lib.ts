import { Card } from "./card.js";
import { Size } from "./game.js";

export interface CardDefintion {
	back?: HTMLImageElement;
	face?: HTMLImageElement;
}

export interface CardProducer {
	getCard(name: string): Card | undefined;
	getRandomCard(): Card | undefined;
}

export class CardLibrary implements CardProducer {
	private cardDefinitions: Map<string, CardDefintion>;
	private defaultReverse?: HTMLImageElement;
	private defaultCardSize: Size = {width: 100, height: 100};

	constructor() {
		this.cardDefinitions = new Map();
	}

	setDefaultReverse(image: HTMLImageElement) {
		this.defaultReverse = image;
	}

	setDefaultSize(size: Size) {
		this.defaultCardSize = size;
	}

	registerDefinition(name: string, face?: HTMLImageElement, back?: HTMLImageElement) {
		const def = {
			face: face,
			back: back ?? this.defaultReverse,
		};
		this.cardDefinitions.set(name, def);
	}

	getCard(name: string): Card | undefined {
		const def = this.cardDefinitions.get(name);
		if (!def) return undefined;

		return new Card(
			def.back,
			def.face,
			{width: this.defaultCardSize.width, height: this.defaultCardSize.height},
			name,
		);
	}

	hasDefinition(name: string): boolean {
		return this.cardDefinitions.has(name);
	}

	clearLibrary() {
		this.cardDefinitions.clear();
	}

	getRandomCard(): Card | undefined {
		const keys = Array.from(this.cardDefinitions.keys());
		const randomKey = keys[Math.floor(Math.random() * keys.length)];
		return this.getCard(randomKey);
	}

	getKeys(): string[] {
		return Array.from(this.cardDefinitions.keys());
	}

	toDeck(): Deck {
		return new Deck(this);
	}
}

export class Deck implements CardProducer {
	cardLib: CardLibrary;
	cards: string[];

	constructor(library: CardLibrary, cards?: string[]) {
		this.cardLib = library;
		this.cards = cards ?? library.getKeys();
	}

	shuffle() {
		this.cards.sort(() => Math.random() - 0.5);
	}

	getCard(name: string): Card | undefined {
		return this.cardLib.getCard(name);
	}

	getRandomCard(): Card | undefined {
		throw new Error("Method not implemented.");
	}

	draw(): Card | undefined {
		const name = this.cards.pop();
		if (!name) return;
		return this.cardLib.getCard(name);
	}

	double() {
		this.cards = [...this.cards, ...this.cards];
	}

	subdeck(amount: number, options?: SubdeckOptions) {
		const chosen = this.cards.slice(0, amount);
		const subdeck = new Deck(this.cardLib, chosen);
		if (!options) return subdeck;
		if (options.doubled) subdeck.double();
		if (options.shuffled) subdeck.shuffle();
		return subdeck
	}
}

export interface SubdeckOptions {
	shuffled?: boolean,
	doubled?: boolean,
}
