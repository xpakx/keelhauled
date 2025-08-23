import { Animation, DealingAnimation, FlippingAnimation, ShakingAnimation } from "./animation.js";
import { Position, Size } from "./game.js";

export class Card {
	back?: HTMLImageElement;
	face?: HTMLImageElement;
	size: Size;
	drawDelta: Position;

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
	) {
		this.back = back;
		this.face = face;
		this.size = size;
		this.drawDelta = {x: 0, y: 0};
	}

	tick(timestamp: number, hovered: boolean) {
		this.hovered = hovered;

		if (this.hovered && !this.animation) this.animation = this.shakingAnimation;
		else if (this.animation && this.animation.name == "shaking") this.animation = undefined;
		if (this.animation) {
			this.animation.tick(timestamp, this);
			if (this.animation.finished) {
				this.animation.clean(this);
				this.animation = undefined;
			}
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
		this.animation = this.flippingAnimation;
		if (this.animation.init) this.animation.init();
	}

	deal(delta: Position, animationDelta: number = 0) {
		this.animation = this.dealingAnimation;
		this.dealingAnimation.deal(delta, animationDelta);
	}
}
