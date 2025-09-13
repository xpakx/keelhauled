import { Card } from "./card.js";
import { Position } from "./game.js";

export interface Animation {
	name: string;
	finished: boolean;
	tick(timestamp: number, card: Card): undefined;
	clean(card: Card): undefined;
	draw?(ctx: CanvasRenderingContext2D, position: Position, card: Card): undefined;
	init?(): undefined;
}

export class ShakingAnimation implements Animation {
	name: string = "shaking"
	amplitude: number = 1;
	finished: boolean = false;

	tick(timestamp: number, card: Card): undefined {
		const amplitude = 1;
		card.drawDelta.x = Math.sin(timestamp * 0.02) * amplitude;
		card.drawDelta.y = Math.cos(timestamp * 0.03) * amplitude;
	}

	clean(card: Card): undefined {
		card.drawDelta.x = 0;
		card.drawDelta.y = 0;
	}
}

export class FlippingAnimation implements Animation {
	name: string = "flipping"
	finished: boolean = false;

	flipStartTime: number = 0;
	flipping: boolean = false;
	flipDuration: number = 300;
	flippingProgress: number = 0;
	targetFlipped: boolean = false;
	markForFlipping: boolean = false;

	tick(timestamp: number, card: Card): undefined {
		if (this.markForFlipping) {
			this.targetFlipped = !card.flipped;
			this.flipping = true;
			this.flipStartTime = timestamp;
			this.flippingProgress = 0;
			this.markForFlipping = false;
		}
		if (this.flipping) this.progressFlipping(timestamp, card)
	}

	clean(card: Card): undefined {
		card.drawDelta.x = 0;
		card.drawDelta.y = 0;
	}

	progressFlipping(timestamp: number, card: Card) {
		const elapsed = timestamp - this.flipStartTime;
		this.flippingProgress = Math.min(elapsed / this.flipDuration, 1);

		if (this.flippingProgress >= 0.5 && card.flipped !== this.targetFlipped) {
			card.flipped = this.targetFlipped;
		}

		if (this.flippingProgress >= 1) {
			this.flipping = false;
			this.finished = true;
		}
	}

	draw(ctx: CanvasRenderingContext2D, position: Position, card: Card): undefined {
		const img = card.flipped ? card.face : card.back;
		if (!img) return;
		ctx.save();

		const scaleX = Math.abs(1 - this.flippingProgress * 2);

		ctx.translate(position.x + card.size.width / 2, position.y + card.size.height / 2);
		ctx.scale(scaleX, 1);
		ctx.drawImage(img, -card.size.width / 2, -card.size.height / 2, card.size.width, card.size.height);

		ctx.restore();
	}

	init(): undefined {
		if (this.flipping) return;
		this.markForFlipping = true;
		this.finished = false;
	}
}

export class DealingAnimation implements Animation {
	name: string = "dealing"
	finished: boolean = false;

	dealDuration: number = 300;
	dealStart: number = 0;
	markForDeal: boolean = false;
	waitForDeal: number = 0;
	dealDelta: Position = {x: 0, y: 0};

	tick(timestamp: number, card: Card): undefined {
		if (this.markForDeal) {
			this.markForDeal = false;
			this.dealStart = timestamp;
			card.drawDelta.x = this.dealDelta.x;
			card.drawDelta.y = this.dealDelta.y;
		}

		if (this.waitForDeal > 0) {
			const elapsed = timestamp - this.dealStart;
			if (elapsed >= this.waitForDeal) {
				this.waitForDeal = 0;
				this.dealStart = timestamp;
			}
			return;
		}
		if (card.drawDelta.x == 0 && card.drawDelta.y == 0) {
			this.finished = true;
		} else {
			const elapsed = timestamp - this.dealStart;
			const progress = 1 - Math.min(elapsed / this.dealDuration, 1);
			card.drawDelta.x = this.dealDelta.x*progress;
			card.drawDelta.y = this.dealDelta.y*progress;
		}
	}

	clean(card: Card): undefined {
		card.drawDelta.x = 0;
		card.drawDelta.y = 0;
		card.dealt = true;
	}

	init(): undefined {
		this.markForDeal = true;
		this.finished = false;
	}

	deal(delta: Position, animationDelta: number = 0) {
		this.init();
		this.dealDelta.x = delta.x;
		this.dealDelta.y = delta.y;
		this.waitForDeal = animationDelta;
	}
}

export class SpriteAnimation implements Animation {
	name: string;
	amplitude: number = 1;
	finished: boolean = false;

	frameLength: number;
	started: number;

	frame: number;
	frames: HTMLImageElement[] = [];

	timesToLoop?: number;
	originalFace: HTMLImageElement | undefined;

	constructor(name: string, sequence: HTMLImageElement[], originalFace?: HTMLImageElement, timesToLoop?: number) {
		this.name = name;
		this.frameLength = 30;
		this.started = 0;
		this.frame = 0;
		this.frames = sequence;
		this.timesToLoop = timesToLoop;
		this.originalFace = originalFace;
	}

	tick(timestamp: number, card: Card): undefined {
		if (timestamp < this.started) return;
		const elapsed = timestamp - this.started;
		this.frame = Math.floor(elapsed / this.frameLength) % this.frames.length;

		card.face = this.frames[this.frame];

		if (this.timesToLoop) {
			let currentLoop = Math.floor(elapsed / (this.frames.length * this.frameLength));
			if (currentLoop >= this.timesToLoop) this.finished = true;
		}
	}

	clean(card: Card): undefined { 
		card.face = this.originalFace;
	}

	init(): undefined {
		this.started = performance.now();
	}
}
