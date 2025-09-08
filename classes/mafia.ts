import { Assets } from "./assets.js";
import { CardLibrary, Deck } from "./card-lib.js";
import { CardSlot, StartDataFn } from "./card.js";
import { Circle } from "./containers/circle.js";
import { Game, Position } from "./game.js";
import { CardLoader, DefaultCardLoader, Rules } from "./rules.js";
import { Drawable } from "./drawable.js";

interface CardData {
	skillUsed: boolean,
	lying: boolean,
	evil: boolean,
	identity: string;
	realIdentity?: string,
	killed: boolean;
	corruptible: boolean;
	skillToSelect?: number;
	hint?: string;
}

const dataFn: StartDataFn<CardData> = (name: string) => {
	return {
		skillUsed: false,
		lying: false,
		evil: false,
		killed: false,
		identity: name,
		corruptible: true,
	}
};

type SkillSelection = SkillSelectionSelected | SkillSelectionUnselected;

interface SkillSelectionSelected {
	active: true;
	slot: CardSlot<CardData>;
	actorsToSelect: number;
	selection: CardSlot<CardData>[];
}

interface SkillSelectionUnselected {
	active: false;
}

export class MafiaRules implements Rules {
	won: boolean = false;
	cardsFlipped: number = 0;
	selection: SkillSelection = {active: false};
	killSkill: boolean = false;
	interface: CardInfoInterface[] = [];

	init(game: Game): void {
		const board = new Circle<CardData>(
			{x: 0, y: 0}, 
			{width: game.canvas.width, height: game.canvas.height},
			200,
		);
		game.registerContainer("board", board);
		this.startGame(game, board);
		this.addDrawables(game, board);
	}

	startGame(game: Game, board: Circle<CardData>) {
		const lib = game.cardLib as MafiaLib<ActorType>;
		const deckVillagers: Deck = lib.getDeckOf("villager");
		const deckMinions: Deck = lib.getDeckOf("minion");
		deckVillagers.shuffle();
		deckMinions.shuffle();

		const subdeck = deckVillagers.subdeck(5);
		subdeck.join(deckMinions.subdeck(1))
		subdeck.shuffle();

		board.setDataFunction(dataFn);
		board.setCards(subdeck.getCards());

		const deck = lib.getDeckOf("villager");
		for (let slot of board.cards) {
			const card = slot.getCard();
			if (!card) continue;
			const data = lib.generateData(card.name);
			if (!data) continue;
			slot.setData(data);
			if (data.evil) {
				data.realIdentity = card.name;
				const newIdentity = deck.getRandomCard();
				if (newIdentity) {
					data.identity =  newIdentity.name;
					slot.putCard(newIdentity, "empty");
					const dataDisguise = lib.generateData(newIdentity.name);
					if (dataDisguise) data.skillToSelect = dataDisguise.skillToSelect;
					if (dataDisguise && !dataDisguise.corruptible) {
						data.lying = false;
						data.corruptible = false;
					}
					lib.on("onDisguise", slot, board.cards);
				}
			}
		}

		for (let slot of board.cards) lib.on("onDeal", slot, board.cards);
	}

	onSlotClick(game: Game, slot: CardSlot<CardData>, _coord?: Position): void {
		const lib = game.cardLib as MafiaLib<ActorType>;
		const card = slot.getCard()
		if (!card) return;
		console.log(slot);

		if (this.selection.active) {
			if (slot === this.selection.slot) return;
			if (this.selection.selection.indexOf(slot) >= 0) return;

			this.selection.selection.push(slot);
			if (this.selection.selection.length >= this.selection.actorsToSelect) {
				lib.on("onSkill", this.selection.slot, this.selection.selection);
				const data = this.selection.slot.getData();
				if (data) data.skillUsed = true;
				this.selection = {active: false};
			}
			return;
		}

		// TODO: killSkill activation
		if (this.killSkill) {
			if (!slot.getData()?.killed) game.audio?.play("hit");
			this.kill(slot, game);
			this.killSkill = false;
			return;
		}

		if (card.flipped) {
			const data = slot.getData();
			if (data && data.skillToSelect && data.skillToSelect > 0 && !data.skillUsed) {
				this.selection = {
					active: true,
					slot: slot,
					actorsToSelect: data.skillToSelect,
					selection: [],
				};
				return;
			}
			
			// TODO: skill selection activation
		} else {
			const board = game.getContainer("board") as Circle<CardData> | undefined;
			if (!board) return;
			card.flipCard();
			lib.on("onReveal", slot, board.cards);
			game.audio?.play("flip", {offset: 0.2});
			this.cardsFlipped += 1;
			if (this.cardsFlipped >= 4) {
				this.cardsFlipped = 0;
				for (let slot of board.cards) lib.on("onDayEnd", slot, board.cards); // TODO: real identity?
			}
		}
	}

	kill(slot: CardSlot<CardData>, game: Game) {
		let card = slot.getCard()
		if (!card) return;
		const data = slot.getData();
		if (!data) return;
		if (data.killed) return;
		const lib = game.cardLib as MafiaLib<ActorType>;
		const board = game.getContainer("board") as Circle<CardData> | undefined;
		if (!board) return;

		lib.on("onKill", slot, board.cards); // TODO: use real identity?

		if (data.realIdentity) {
			card = lib.getCard(data.realIdentity);
			if (!card) return;
			card.dealt = true;
			card.flipped = true;
			slot.putCard(card, "empty");
			data.identity = data.realIdentity;
		}

		data.killed = true;

		if(data.evil) {
			console.log(`Killed evil ${data.identity}.`);
		} else {
			console.log(`Killed ${data.identity}.`);
		}

		const toKill = MafiaHelper.getEvilCards(board.cards)
		.filter(c => !c.slot.getData()?.killed)
		.length;
		if (toKill == 0) this.won = true;

	}

	isGameOver(_game: Game): boolean {
		return this.won;
	}

	onGameOver(game: Game): void {
		console.log("You won!");
		this.won = false;

		const grid = game.getContainer("board");
		if (!grid) return;

		setTimeout(() => {
			grid.getCards().filter(c => c.flipped).forEach(c => c.flipCard());
			setTimeout(() => {
				const grid = game.getContainer("board") as Circle<CardData>;
				if (!grid) return;
				this.startGame(game, grid);
				grid.getCards().forEach(c => {
					c.animation = undefined;
					c.dealt = true
				});
			}, 500);
		}, 500);
	}

	drawCard(): string | undefined {
		return undefined;
	}

	addDrawables(game: Game, board: Circle<CardData>) {
		board.cards.forEach((slot, i) => {
			slot.addDrawable(new NumberCounter({x: 0, y: 0}, i+1, game.cardLib.getDefaultSize().width));
			slot.addDrawable(new ActionIndicator({x: 0, y: 0}));
			slot.addDrawable(new HintIndicator({x: 0, y: 0}));
		});
	}
}

export type SkillFn = (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => void;

interface ActorSkills {
	onDeal?: SkillFn,
	onReveal?: SkillFn,
	onDisguise?: SkillFn,
	onKill?: SkillFn,
	onSkill?: SkillFn,
	onDayEnd?: SkillFn,
}

type Hook = keyof ActorSkills;

type ActorDefinition = Partial<Omit<ActorData, 'name'>> & Pick<ActorData, 'name'> & ActorSkills;

interface ActorData {
	name: string;
	cardKey: string;
	evil: boolean;
	lying: boolean;
	corruptible: boolean;
	skillToSelect?: number;
	hint?: string;
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
		if (actors.includes(actor.name)) return;
		actors.push(actor.name);

		this.actorData.set(actor.name, {
			name: actor.name,
			cardKey: actor.cardKey ?? actor.name,
			evil: actor.evil ? true : false,
			lying: actor.lying ? true : false,
			corruptible: actor.corruptible === undefined ? true : actor.corruptible,
			skillToSelect: actor.skillToSelect,
		});

		this.skills.set(actor.name, {
			onDeal: actor.onDeal,
			onReveal: actor.onReveal,
			onKill: actor.onKill,
			onSkill: actor.onSkill,
			onDayEnd: actor.onDayEnd,
			onDisguise: actor.onDisguise,
		});
	}

	generateData(name: string): CardData | undefined {
		let actorData = this.actorData.get(name);
		if (!actorData) return;

		return {
			skillUsed: false,
			lying: actorData.lying,
			evil: actorData.evil,
			killed: false,
			identity: name,
			corruptible: actorData.corruptible,
			skillToSelect: actorData.skillToSelect,
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
		console.log(`Running hook ${hook} for ${actor}`);
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
			const data = card.getData();
			if (!data) return;

			const hunterIndex = cards.indexOf(card);

			const evilIndices = MafiaHelper.getEvilIndices(cards);

			if (evilIndices.length === 0) {
				console.log("There is no evil");
				return;
			}

			const distance = MafiaHelper.closestDistance(hunterIndex, evilIndices, cards.length);

			const isLying = data.lying;

			let reportedDistance;
			if (isLying) {
				reportedDistance = Math.floor(Math.random() * (cards.length - 1)) + 1;
			} else {
				reportedDistance = distance;
			}

			data.hint = `I'm ${reportedDistance} cards away from closest evil`;
		}
	});
	lib.addCardDefinition("villager", {
		name: "enlightened",
		onReveal: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const data = card.getData();
			if (!data) return;

			const enlightenedIndex = cards.indexOf(card);
			const total = cards.length;

			const evilIndices = MafiaHelper.getEvilIndices(cards);

			if (evilIndices.length === 0) {
				console.log("There is no evil");
				return;
			}

			let direction = MafiaHelper.closestDirection(enlightenedIndex, evilIndices, total);
			if (card.getData()?.lying) direction = MafiaHelper.getRandomDirection(direction);

			data.hint = `Closest evil is ${direction}`;
		}
	});
	lib.addCardDefinition("villager", {
		name: "confessor",
		corruptible: false,
		onReveal: (card: CardSlot<CardData>, _cards: CardSlot<CardData>[]) => {
			const data = card.getData();
			if (!data) return;

			if (MafiaHelper.isEvil(card) || MafiaHelper.isCorrupted(card)) {
				data.hint = "I'm dizzy";
			} else {
				data.hint = "I'm good";
			}
		},
	});
	lib.addCardDefinition("villager", {
		name: "medium",
		onReveal: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const data = card.getData();
			if (!data) return;

			if (!data.lying) {
				const goodCharacters = MafiaHelper.getGoodCards(cards);

				if (goodCharacters.length === 0) {
					console.log("No good characters.");
					return;
				}

				const { i, slot } = goodCharacters[Math.floor(Math.random() * goodCharacters.length)];

				data.hint = `#${i+1} is a real ${slot.getData()?.realIdentity ?? slot.getData()?.identity}`;
			} else {
				const disguisedCharacters = MafiaHelper.getDisguisedCards(cards);
				if (disguisedCharacters.length === 0) {
					console.log("No disguised characters.");
					return;
				}

				const { i, slot } = disguisedCharacters[Math.floor(Math.random() * disguisedCharacters.length)];
				data.hint = `#${i+1} is a real ${slot.getData()?.identity}`;
			}
		},
	});
	lib.addCardDefinition("villager", {
		name: "empress",
		onReveal: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const data = card.getData();
			if (!data) return;

			const evilSlots = MafiaHelper.getEvilIndices(cards);
			const goodSlots = MafiaHelper.getGoodIndices(cards);

			let picks;
			if (!data.lying) {
				if (evilSlots.length === 0 || goodSlots.length < 2) {
					console.log("Empress cannot deliver her prophecy.");
					return;
				}

				const evilPick = evilSlots[Math.floor(Math.random() * evilSlots.length)];
				const shuffledGoods = goodSlots.sort(() => Math.random() - 0.5);
				const goodPicks = shuffledGoods.slice(0, 2);
				picks = [evilPick, ...goodPicks];
			} else {
				const shuffledGoods = goodSlots.sort(() => Math.random() - 0.5);
				picks = shuffledGoods.slice(0, 3);
			}

			picks = picks.sort(() => Math.random() - 0.5).map(i => i+1);
			data.hint = `1 of ${picks.join(", ")} is evil`;
		}
	});
	lib.addCardDefinition("villager", {
		name: "judge",
		skillToSelect: 1,
		onSkill: (card: CardSlot<CardData>, cards: CardSlot<CardData>[]) => {
			const data = card.getData();
			if (!data) return;

			const target = cards[0];
			const isTargetLying = target.getData()?.lying;
			if (!data.lying) {
				data.hint = `${target.getData()?.identity} is ${isTargetLying ? 'lying' : 'telling truth'}`;
			} else {
				data.hint = `${target.getData()?.identity} is ${isTargetLying ? 'telling truth' : 'lying'}`;
			}
		}
	});

	lib.addCardDefinition("minion", {name: "minion", evil: true, lying: true});

	return lib;
}

export class MafiaCardLoader extends DefaultCardLoader implements CardLoader {
	async load(cardLib: CardLibrary): Promise<undefined> {
		const cardImage = await Assets.loadImage("images/card.png");
		const faceImage = await Assets.loadImage("images/empty.png");

		const sprites = await Assets.loadImage("images/mafia/portraits.png");
		const portraits = await Assets.splitGridImage(sprites, 3, 2);

		cardLib.setDefaultReverse(cardImage);
		cardLib.registerDefinition("empty", faceImage);

		const villagers = ["hunter", "enlightened", "medium", "confessor", "empress"];
		this.registerForType(villagers, faceImage, portraits, cardLib);

		// TODO: add judge
		const portraits2 = await Assets.splitGridImage(sprites, 3, 2);
		this.registerForType(['judge'], faceImage, portraits2, cardLib);

		const minions = ["minion"];
		this.registerForType(minions, faceImage, portraits, cardLib, "red");
	}

	registerForType(names: string[], emptyCard: HTMLImageElement, portraits: HTMLImageElement[], cardLib: CardLibrary, color?: string) {
		for (let name of names) {
			const image = this.createCardImage(
				emptyCard,
				portraits.shift()!,
				name,
				color,
			);
			cardLib.registerDefinition(name, image);
		}
	}

	createCardImage(
		emptyCard: HTMLImageElement,
		portrait: HTMLImageElement,
		name: string,
		color?: string,
	): HTMLImageElement {
		const canvas = new OffscreenCanvas(emptyCard.width, emptyCard.height);
		canvas.width = emptyCard.width;
		canvas.height = emptyCard.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2D context!");

		ctx.drawImage(emptyCard, 0, 0, canvas.width, canvas.height);
		if (color) {
			ctx.fillStyle = color;
			ctx.globalAlpha = 0.14;
			ctx.globalCompositeOperation = "source-atop";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		}

		const padding = 0.09 * canvas.width;

		ctx.drawImage(portrait, padding, padding, canvas.width - 2*padding, canvas.height - 2*padding);

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

type Direction = "clockwise" | "counterclockwise" | "equidistant";

class MafiaHelper {
	static closestIndexClockwise(selfIndex: number, indices: number[], len: number) {
		let closestIndex = indices[0];
		let minDistance = len;

		for (const idx of indices) {
			const distance = (idx - selfIndex + len) % len;
			if (distance < minDistance) {
				minDistance = distance;
				closestIndex = idx;
			} 
		}
		return {index: closestIndex, distance: minDistance};
	}

	static closestIndexCounterclockwise(selfIndex: number, indices: number[], len: number) {
		let closestIndex = indices[0];
		let minDistance = len;

		for (const idx of indices) {
			const distance = (selfIndex - idx + len) % len;
			if (distance < minDistance) {
				minDistance = distance;
				closestIndex = idx;
			} 
		}
		return {index: closestIndex, distance: minDistance};
	}

	static closestIndex(selfIndex: number, indices: number[], len: number, dir: "clockwise" | "counterclockwise") {
		if (dir === "clockwise") return this.closestIndexClockwise(selfIndex, indices, len).index;
		else return this.closestIndexCounterclockwise(selfIndex, indices, len).index;
	}

	static closestDistanceDir(selfIndex: number, indices: number[], len: number, dir: "clockwise" | "counterclockwise") {
		if (dir === "clockwise") return this.closestIndexClockwise(selfIndex, indices, len).distance;
		else return this.closestIndexCounterclockwise(selfIndex, indices, len).distance;
	}

	static closestDistance(selfIndex: number, indices: number[], len: number) {
		const cw = this.closestDistanceDir(selfIndex, indices, len, "clockwise");
		const ccw = MafiaHelper.closestDistanceDir(selfIndex, indices, len, "counterclockwise");
		return Math.min(cw, ccw);
	}

	static closestDirection(selfIndex: number, indices: number[], len: number): Direction {
		const cw = this.closestDistanceDir(selfIndex, indices, len, "clockwise");
		const ccw = this.closestDistanceDir(selfIndex, indices, len, "counterclockwise");

		if (cw === ccw) return "equidistant";
		else return cw < ccw ? "clockwise" : "counterclockwise";
	}

	static getRandomDirection(exclude?: Direction): Direction {
		let options: Direction[] = ["clockwise", "counterclockwise", "equidistant"];
		if (exclude) {
			options = options.filter(d => d !== exclude);
		}
		return options[Math.floor(Math.random() * options.length)];
	}

	static isEvil(card: CardSlot<CardData>) {
		return card.getData()?.evil;
	}

	static getEvilCards(cards: CardSlot<CardData>[]) {
		return cards
			.map((slot, i) => ({ i, slot }))
			.filter(({ slot }) => this.isEvil(slot))
	}

	static getEvilIndices(cards: CardSlot<CardData>[]) {
		return this.getEvilCards(cards)
			.map(({ i }) => i);
	}

	static isLying(card: CardSlot<CardData>) {
		return card.getData()?.lying;
	}

	static isDisguised(card: CardSlot<CardData>) {
		return card.getData()?.realIdentity !== undefined && 
			card.getData()?.realIdentity !== card.getData()?.identity;
	}

	static isCorrupted(card: CardSlot<CardData>) {
		return this.isLying(card) || this.isDisguised(card);
	}

	static isGood(card: CardSlot<CardData>) {
		return !card.getData()?.evil;
	}

	static getGoodCards(cards: CardSlot<CardData>[]) {
		return cards
			.map((slot, i) => ({ i, slot }))
			.filter(({ slot }) => this.isGood(slot))
	}

	static getGoodIndices(cards: CardSlot<CardData>[]) {
		return this.getGoodCards(cards)
			.map(({ i }) => i);
	}

	static getDisguisedCards(cards: CardSlot<CardData>[]) {
		return cards
			.map((slot, i) => ({ i, slot }))
			.filter(({ slot }) => this.isDisguised(slot))
	}

	static getDisguisedIndices(cards: CardSlot<CardData>[]) {
		return this.getDisguisedCards(cards)
			.map(({ i }) => i);
	}

	static corrupt(card: CardSlot<CardData>) {
		const data = card.getData();
		if (!data) return;
		if (!data.corruptible) return;
		data.lying = true;
	}
}

interface CardInfoInterface {
	number: NumberCounter;
	hint: HintIndicator;
	actionIndicator: ActionIndicator;
}

class NumberCounter implements Drawable<void, CardData> {
	position: Position;
	num: number;
	cardWidth: number;

	constructor(position: Position, num: number, cardWidth: number) {
		this.position = position;
		this.cardWidth = cardWidth;
		this.num = num;
	}

	draw(ctx: CanvasRenderingContext2D, slot: CardSlot<CardData>, position?: Position): void {
		ctx.fillStyle = "#fff";
		ctx.font = `21px sans-serif`;
		ctx.textAlign = "left";
		ctx.textBaseline = "bottom";
		const text = `#${this.num}`;
		const textMetrics = ctx.measureText(text);
		const centerX = slot.coord.x + this.cardWidth / 2 - textMetrics.width / 2;
		ctx.fillText(
			text,
			centerX + (position?.x ?? 0),
			slot.coord.y + (position?.y ?? 0)
		);
	}

	getPosition(): Position {
		return this.position;
	}
}

class ActionIndicator implements Drawable<void, CardData> {
	position: Position;

	constructor(position: Position) {
		this.position = position;
	}

	draw(ctx: CanvasRenderingContext2D, slot: CardSlot<CardData>, position?: Position): void {
		const data = slot.getData();
		if (!data) return;
		const card = slot.getCard();
		if (!card) return;
		if (data.skillUsed || !data.skillToSelect || !card.flipped) return;


		ctx.fillStyle = "blue";
		ctx.beginPath();
		ctx.arc(
			slot.coord.x + (position?.x ?? 0),
			slot.coord.y + (position?.y ?? 0),
			10,
			0,
			2 * Math.PI
		);
		ctx.fill();
	}

	getPosition(): Position {
		return this.position;
	}
}

class HintIndicator implements Drawable<void, CardData> {
	position: Position;

	constructor(position: Position) {
		this.position = position;
	}

	draw(ctx: CanvasRenderingContext2D, slot: CardSlot<CardData>, position?: Position): void {
		const data = slot.getData();
		if (!data || !data.hint) return;

		const x = slot.coord.x + (position?.x ?? 0);
		const y = slot.coord.y + (position?.y ?? 0);

		ctx.font = "14px sans-serif";
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		const padding = 6;
		const text = data.hint;

		const textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = 16;

		const boxWidth = textWidth + padding * 2;
		const boxHeight = textHeight + padding * 2;

		ctx.beginPath();
		ctx.roundRect(x, y, boxWidth, boxHeight, 6);
		ctx.fillStyle = "black";
		ctx.fill();

		ctx.lineWidth = 2;
		ctx.strokeStyle = "rgba(100,150,255,0.9)";
		ctx.stroke();

		ctx.fillStyle = "white";
		ctx.fillText(text, x + padding, y + padding);
	}

	getPosition(): Position {
		return this.position;
	}
}
