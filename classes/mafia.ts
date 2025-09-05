import { Assets } from "./assets.js";
import { CardLibrary, Deck } from "./card-lib.js";
import { CardSlot, StartDataFn } from "./card.js";
import { Circle } from "./containers/circle.js";
import { Game, Position } from "./game.js";
import { CardLoader, DefaultCardLoader, Rules } from "./rules.js";

interface CardData {
	usableSkill: boolean,
	skillUsed: boolean,
	lying: boolean,
	evil: boolean,
	identity: string;
	realIdentity?: string,
}

const dataFn: StartDataFn<CardData> = (name: string) => {
	return {
		usableSkill: false,
		skillUsed: false,
		lying: false,
		evil: false,
		identity: name,
	}
};

export class MafiaRules implements Rules {

    init(game: Game): void {
	    const lib = game.cardLib as MafiaLib<ActorType>;
	    const deckVillagers: Deck = lib.getDeckOf("villager");
	    const deckMinions: Deck = lib.getDeckOf("minion");
	    deckVillagers.shuffle();
	    deckMinions.shuffle();

	    const subdeck = deckVillagers.subdeck(5);
	    subdeck.join(deckMinions.subdeck(1))
	    subdeck.shuffle();

	    const board = new Circle(
		    {x: 0, y: 0}, 
		    {width: game.canvas.width, height: game.canvas.height},
		    200,
	    );
	    board.setDataFunction(dataFn);
	    board.setCards(subdeck.getCards());

	    for (let slot of board.cards) {
		    const card = slot.getCard();
		    if (!card) continue;
		    const data = lib.generateData(card.name);
		    if (!data) continue;
		    slot.setData(data);
		    if (data.evil) {
			    const deck = lib.getDeckOf("villager");
			    deck.shuffle();
			    data.realIdentity = card.name;
			    const newIdentity = deck.draw();
			    if (newIdentity) {
				    data.identity =  newIdentity.name;
				    slot.putCard(newIdentity, "empty");
			    }
		    }
	    }
	    game.registerContainer("board", board);
    }

    onSlotClick(game: Game, slot: CardSlot<CardData>, _coord?: Position): void {
	    const lib = game.cardLib as MafiaLib<ActorType>;
	    const card = slot.getCard()
	    if (!card) return;

	    if (card.flipped) {
		    // TODO
	    } else {
		    const board = game.getContainer("board") as Circle<CardData> | undefined;
		    if (!board) return;
		    card.flipCard();
		    lib.on("onReveal", slot, board.cards);
		    game.audio?.play("flip", {offset: 0.2});
	    }
    }

    isGameOver(_game: Game): boolean {
	    return false;
    }

    drawCard(): string | undefined {
	   return undefined;
    }
}

export type SkillFn = (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => void;

interface ActorSkills {
	onDeal?: SkillFn,
	onReveal?: SkillFn,
	onKill?: SkillFn,
	onSkill?: SkillFn,
	onDayEnd?: SkillFn,
}

type Hook = keyof ActorSkills;

interface ActorDefinition {
	name: string,
	evil?: boolean,
	lying?: boolean,
	cardKey?: string,
	onDeal?: SkillFn,
	onReveal?: SkillFn,
	onKill?: SkillFn,
	onSkill?: SkillFn,
	onDayEnd?: SkillFn,
}

interface ActorData {
	name: string;
	cardKey: string;
	evil: boolean;
	lying: boolean;
}

export class MafiaLib<T> extends CardLibrary {
	skills: Map<string, ActorSkills> = new Map();
	actorsByType: Map<T, string[]> = new Map();
	actorData: Map<string, ActorData> = new Map();

	addCardDefinition(type: T, actor: ActorDefinition) {
		let actors = this.actorsByType.get(type);
		if (!actors) {
			actors = [];
			this.actorsByType.set(type, actors);
		}
		if (actor.name in actors) return;
		actors.push(actor.name);

		this.actorData.set(actor.name, {
			name: actor.name,
			cardKey: actor.cardKey ?? actor.name,
			evil: actor.evil ? true : false,
			lying: actor.lying ? true : false,
		});

		this.skills.set(actor.name, {
			onDeal: actor.onDeal,
			onReveal: actor.onReveal,
			onKill: actor.onKill,
			onSkill: actor.onSkill,
			onDayEnd: actor.onDayEnd,
		});
	}

	generateData(name: string): CardData | undefined {
		let actorData = this.actorData.get(name);
		if (!actorData) return;

		return {
			usableSkill: false,
			skillUsed: false,
			lying: actorData.lying,
			evil: actorData.evil,
			identity: name,
		}
	}

	getType(type: T) {
		return this.actorsByType.get(type) || [];
	}

	getDeckOf(type: T): Deck {
		return this.extractAsDeck(this.getType(type));
	}

	on(hook: Hook, slot: CardSlot<CardData>, slots: CardSlot<CardData>[]) {
		const actor = slot.getData()?.identity;
		if (!actor) return;
		const skill = this.skills.get(actor);
		if (!skill) return;
		if (skill[hook]) skill[hook](slot, slots);
	}
}

type ActorType = "villager" | "outcast" | "minion" | "demon";


export function getMafiaLibrary(): CardLibrary {
	const lib = new MafiaLib<ActorType>();
	// TODO register skills
	lib.addCardDefinition("villager", {
		name: "hunter",
		onReveal: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const hunterIndex = cards.indexOf(card);

			const evilIndices = cards
				.map((slot, i) => ({ i, slot }))
				.filter(({ slot }) => slot.getData()?.evil)
				.map(({ i }) => i);

			if (evilIndices.length === 0) {
				console.log("There is no evil");
				return;
			}

			let closestIndex = evilIndices[0];
			let minDistance = Math.abs(closestIndex - hunterIndex);

			for (const idx of evilIndices) {
				const dist = Math.abs(idx - hunterIndex);
				if (dist < minDistance) {
					minDistance = dist;
					closestIndex = idx;
				}
			}
			const isLying = card.getData()?.lying;

			let reportedDistance;
			if (isLying) {
				reportedDistance = Math.floor(Math.random() * (cards.length - 1)) + 1;
			} else {
				reportedDistance = Math.abs(closestIndex - hunterIndex);
			}

			console.log(`I'm ${minDistance} cards away from closest evil`);
		}
	});
	lib.addCardDefinition("villager", {
		name: "enlightened",
		onReveal: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const hunterIndex = cards.indexOf(card);
			const total = cards.length;

			const evilIndices = cards
				.map((slot, i) => ({ i, slot }))
				.filter(({ slot }) => slot.getData()?.evil)
				.map(({ i }) => i);

			if (evilIndices.length === 0) {
				console.log("There is no evil");
				return;
			}

			let closestIndex = evilIndices[0];
			let minDistance = total;

			for (const idx of evilIndices) {
				const cw = (idx - hunterIndex + total) % total;
				const ccw = (hunterIndex - idx + total) % total;

				const distance = Math.min(cw, ccw);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = idx;
				} else if (distance === minDistance) {
					const currentCw = (closestIndex - hunterIndex + total) % total;
					const currentCcw = (hunterIndex - closestIndex + total) % total;
					if (currentCw < currentCcw) closestIndex = idx;
				}
			}

			const cw = (closestIndex - hunterIndex + total) % total;
			const ccw = (hunterIndex - closestIndex + total) % total;
			let direction: string;
			if (cw === ccw) direction = "equidistant";
			else direction = cw < ccw ? "clockwise" : "counterclockwise";

			if (card.getData()?.lying) {
				const options = ["clockwise", "counterclockwise", "equidistant"].filter(d => d !== direction);
				direction = options[Math.floor(Math.random() * options.length)];
			} 

			console.log(`Closest evil is ${direction}`);
		}
	});
	lib.addCardDefinition("villager", {
		name: "confessor",
		onReveal: (card: CardSlot<CardData>, _cards: CardSlot<CardData>[]) => {
			const data = card.getData();
			if (!data) return;
			if (data.evil || data.lying) {
				console.log("I'm dizzy");
			} else {
				console.log("I'm good");
			}
		},
	});
	lib.addCardDefinition("villager", {
		name: "medium",
		onReveal: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const isLying = card.getData()?.lying;
			
			if (!isLying) {
				const goodCharacters = cards
					.map((slot, i) => ({ slot, i }))
					.filter(({ slot }) => !slot.getData()?.evil);

				if (goodCharacters.length === 0) {
					console.log("No good characters.");
					return;
				}

				const { i, slot } = goodCharacters[Math.floor(Math.random() * goodCharacters.length)];

				console.log(`#${i+1} is a real ${slot.getData()?.realIdentity ?? slot.getData()?.identity}`);
			} else {
				const disguisedCharacters = cards
					.map((slot, i) => ({ slot, i }))
					.filter(({ slot }) => slot.getData()?.realIdentity !== undefined);

				if (disguisedCharacters.length === 0) {
					console.log("No disguised characters.");
					return;
				}

				const { i, slot } = disguisedCharacters[Math.floor(Math.random() * disguisedCharacters.length)];
				console.log(`#${i+1} is a real ${slot.getData()?.identity}`);
			}
		},
	});
	lib.addCardDefinition("villager", {name: "empress"});

	lib.addCardDefinition("minion", {name: "minion", evil: true, lying: true});

	return lib;
}

export class MafiaCardLoader extends DefaultCardLoader implements CardLoader {
	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await Assets.loadImage("images/card.png");
		const faceImage = await Assets.loadImage("images/empty.png");
		cardLib.setDefaultReverse(cardImage);
		cardLib.registerDefinition("empty", faceImage);

		const villagers = ["hunter", "enlightened", "confessor", "medium", "empress"];
		this.registerForType(villagers, "blue", faceImage, cardLib);

		const minions = ["minion"];
		this.registerForType(minions, "red", faceImage, cardLib);
	}

	registerForType(names: string[], color: string, emptyCard: HTMLImageElement, cardLib: CardLibrary) {
		for (let name of names) {
			const image = this.createCardImage(
				emptyCard,
				color,
				name,
			);
			cardLib.registerDefinition(name, image);
		}
	}

	createCardImage(
		emptyCard: HTMLImageElement,
		color: string,
		name: string,
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

		ctx.fillStyle = "#fff";
		ctx.font = `${0.1 * canvas.height}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		ctx.fillText(name.toUpperCase(), canvas.width / 2, canvas.height - padding / 2);


		const img = new Image();
		canvas.convertToBlob().then(blob => {
			const url = URL.createObjectURL(blob);
			img.src = url;
		});

		return img;
	}
}
