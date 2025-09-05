import { Animation, DealingAnimation, FlippingAnimation, ShakingAnimation } from "./animation.js";
import { Position, Size } from "./game.js";

export class Card {
	back?: HTMLImageElement;
	face?: HTMLImageElement;
	size: Size;
	drawDelta: Position;
	dealt: boolean = false;
	name: string;

	hovered: boolean = false;
	flipped: boolean = false;

	animation?: Animation;
	shakingAnimation: Animation = new ShakingAnimation();
	flippingAnimation: Animation = new FlippingAnimation();
	dealingAnimation: DealingAnimation = new DealingAnimation();

	constructor(
		back: HTMLImageElement | undefined,
		face: HTMLImageElement | undefined,
		size: Size,
		name: string,
	) {
		this.back = back;
		this.face = face;
		this.name = name;
		this.size = size;
		this.drawDelta = {x: 0, y: 0};
	}

	removeAnimation() {
		this.animation?.clean(this);
		this.animation = undefined;
	}

	isAnimationActive(name: string): boolean {
		return this.animation != undefined && this.animation.name === name;
	}

	tick(timestamp: number, hovered: boolean) {
		this.hovered = hovered;

		if (this.hovered && !this.animation) this.animation = this.shakingAnimation;
		else if (!this.hovered && this.animation && this.animation.name == "shaking") this.removeAnimation();

		if (this.animation) {
			this.animation.tick(timestamp, this);
			if (this.animation.finished) this.removeAnimation();
		}

	}

	draw(ctx: CanvasRenderingContext2D, position: Position) {
		const img = this.flipped ? this.face : this.back;
		if (!img) {
			if (this.hovered) {
				ctx.fillRect(position.x, position.y, this.size.width, this.size.height)
			} else {
				ctx.strokeRect(position.x, position.y, this.size.width, this.size.height)
			}

			return
		}
		if (this.animation && this.animation.draw) {
			this.animation.draw(ctx, position, this);
		} else {
			ctx.drawImage(
				img, 
				position.x + this.drawDelta.x, 
				position.y + this.drawDelta.y,
				this.size.width,
				this.size.height
			);
		}
	}

	revealCard() {
		if (this.flipped) return;
		this.flipCard();
	}

	flipCard() {
		if (!this.dealt) return;
		this.animation = this.flippingAnimation;
		if (this.animation.init) this.animation.init();
	}

	safeToFlip(): boolean {
		if (this.isAnimationActive("flipping")) return false;
		return !this.flipped && this.dealt;
	}

	deal(delta: Position, animationDelta: number = 0) {
		this.animation = this.dealingAnimation;
		this.dealingAnimation.deal(delta, animationDelta);
	}
}

export type StartDataFn<T> = (name: string) => T;

export class CardSlot<T> {
	private cardData?: T;
	private card?: Card;
	coord: Position = {x: 0, y: 0};
	zIndex: number = 0;
	angle: number = 0;
	initFn?: StartDataFn<T>;

	constructor(coord: Position, zIndex: number = 0, angle: number = 0) {
		this.coord = coord;
		this.zIndex = zIndex;
		this.angle = angle;
	}

	setInitFunction(fn: StartDataFn<T>) {
		this.initFn = fn;
	}

	tick(timestamp: number, hovered: boolean): void {
		this.card?.tick(timestamp, hovered);
	}

	draw(ctx: CanvasRenderingContext2D, position: Position) {
		this.card?.draw(ctx, position);
	}

	getData(): T | undefined {
		return this.cardData;
	}

	setData(data: T | undefined): void {
		this.cardData = data;
	}

	hasCard() {
		return this.card !== undefined;
	}

	getCard(): Card | undefined {
		return this.card;
	}

	removeCard() {
		this.card = undefined;
	}

	putCard(card: Card, cardData?: T) {
		this.card = card;
		this.cardData = cardData;
		if (this.initFn) this.cardData = this.initFn(card.name);
	}
}
