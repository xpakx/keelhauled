import { CardLibrary, Deck } from "./card-lib.js";
import { CardSlot, StartDataFn } from "./card.js";
import { Circle } from "./containers/circle.js";
import { Game, Position } from "./game.js";
import { Rules } from "./rules.js";

interface CardData {
	usableSkill: boolean,
	skillUsed: boolean,
	lying: boolean,
	evil: boolean,
	identity: Actor;
	realIdentity?: Actor,
}

const dataFn: StartDataFn<CardData> = (name: string) => {
	return {
		usableSkill: false,
		skillUsed: false,
		lying: false,
		evil: false,
		identity: name as Actor,
	}
};

export class MafiaRules implements Rules {

    init(game: Game): void {
		const deck: Deck = game.cardLib.toDeck();
		deck.shuffle();
		const subdeck = deck.subdeck(8);

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

export class MafiaLib extends CardLibrary {
	skills: Map<Actor, ActorSkills> = new Map();

	getVillagers(): Deck {
		return this.extractAsDeck([...villagers]);
	}

	getOutcasts(): Deck {
		return this.extractAsDeck([...outcasts]);
	}

	getMinions(): Deck {
		return this.extractAsDeck([...minions]);
	}

	getDemons(): Deck {
		return this.extractAsDeck([...demons]);
	}

	on(hook: Hook, slot: CardSlot<CardData>, slots: CardSlot<CardData>[]) {
		const actor = slot.getData()?.identity;
		if (!actor) return;
		const skill = this.skills.get(actor);
		if (!skill) return;
		if (skill[hook]) skill[hook](slot, slots);
	}
}

const villagers = [
	"alchemist", "architect", "baker", "bard", "bishop", "confessor",
	"dreamer", "druid", "empress", "enlightened", "fortune_teller",
	"gemcrafter", "hunter", "jester", "judge", "knight", "knitter",
	"lover", "medium", "oracle", "poet", "scout", "slayer", "witness",
] as const;

const outcasts = [
	"bombardier", "doppelganger", "drunk", "plague_doctor", "wretch",
] as const;

const minions = [
	"counsellor", "minion", "poisoner", "puppet", "puppeteer", "shaman",
	"twin_minion", "witch", 
] as const;

const demons = [
	"baa", "lilis", "pooka",
] as const;

type Villager = (typeof villagers)[number];
type Outcast = (typeof outcasts)[number];
type Minion = (typeof minions)[number];
type Demon = (typeof demons)[number];
export type Good = Villager | Outcast;
export type Evil = Minion | Demon;
export type Actor = Good | Evil;

export type SkillFn = (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => void;

interface ActorSkills {
	onDeal?: SkillFn,
	onReveal?: SkillFn,
	onKill?: SkillFn,
	onSkill?: SkillFn,
	onDayEnd?: SkillFn,
}

type Hook = keyof ActorSkills;


export function getMafiaLibrary(): CardLibrary {
	const lib = new MafiaLib();
	// TODO register skills
	return lib;
}
