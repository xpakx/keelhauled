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
	    game.registerContainer("board", board);
    }

    onSlotClick(game: Game, slot: CardSlot<CardData>, _coord?: Position): void {
	    const card = slot.getCard()
	    if (!card) return;

	    if (card.flipped) {
		    // TODO
	    } else {
		    card.flipCard();
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
	lib.addCardDefinition("villager", {name: "hunter"});
	lib.addCardDefinition("villager", {name: "enlightened"});
	lib.addCardDefinition("villager", {name: "confessor"});
	lib.addCardDefinition("villager", {name: "medium"});
	lib.addCardDefinition("villager", {name: "empress"});

	lib.addCardDefinition("minion", {name: "minion"});

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
