import { Card } from "./card.js";
import { Size } from "./game.js";

export interface CardDefintion {
	back?: HTMLImageElement;
	face?: HTMLImageElement;
}

export class CardLibrary {
	private cardDefinitions: Map<string, CardDefintion>;
	private defaultReverse?: HTMLImageElement;
	private defaultCardSize: Size = {width: 100, height: 100};

	constructor() {
		this.cardDefinitions = new Map();
	}

	setDefaultReverse(image: HTMLImageElement) {
		this.defaultReverse = image;
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
			{width: this.defaultCardSize.width, height: this.defaultCardSize.height}
		);
	}

	hasDefinition(name: string): boolean {
		return this.cardDefinitions.has(name);
	}

	clearLibrary() {
		this.cardDefinitions.clear();
	}
}
