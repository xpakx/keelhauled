import { AudioController } from "./audio.js";
import { CardLibrary } from "./card-lib.js";
import { Card } from "./card.js";
import { CardContainer } from "./containers/card-container.js";
import { InterfaceDrawable } from "./drawable.js";
import { Hand } from "./hand.js";
import { Rules } from "./rules.js";

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

export class Game {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	cardLib: CardLibrary;
	prevTimestamp: number = 0;

	mouseCoord: Position = {x: -1, y: -1};

	defaultCanvasSize: Size = {width: 800, height: 800};

	hand: Hand;
	rules: Rules;

	containers: Map<string, CardContainer<any>> = new Map();
	audio?: AudioController;

	drawables: InterfaceDrawable<unknown>[] = [];

	constructor(
		context: CanvasRenderingContext2D, 
		canvas: HTMLCanvasElement,
		cardLib: CardLibrary,
		rules: Rules,
	) {
		this.context = context;
		this.canvas = canvas;
		this.cardLib = cardLib;
		this.setCanvasSize(this.defaultCanvasSize);
		this.hand = new Hand();
		this.hand.calculatePosition(this.defaultCanvasSize);
		this.rules = rules;
		this.rules.init(this);
	}

	setSound(audio: AudioController) {
		this.audio = audio;
	}

	nextFrame(timestamp: number) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		for (let containerName of this.containers.keys()) {
			const container = this.containers.get(containerName);
			container?.nextFrame(timestamp, this.context);
		}

		this.hand.tick(timestamp, this.mouseCoord);
		this.hand.draw(this.context);
		if (this.hand.dragging && this.hand.selectedCard) {
			const pos = {
				x: this.mouseCoord.x - this.hand.selectedCard.size.width/2, 
				y: this.mouseCoord.y - this.hand.selectedCard.size.height/2
			};
			this.hand.selectedCard?.draw(this.context, pos);
		}

		if (this.rules.isGameOver(this)) {
			this.rules.onGameOver?.(this)
			console.log("Game Over!", this.rules.getState?.());
		}

		for (let drawable of this.drawables) {
			if (drawable && drawable.tick) drawable.tick(timestamp);
			drawable.draw(this.context);
		}
	}

	setCanvasSize(size: Size) {
		this.canvas.width = size.width;
		this.canvas.height = size.height;
	}

	onMouseMove(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;

		for (let containerName of this.containers.keys()) {
			const container = this.containers.get(containerName);
			container?.onMouseMove(this.mouseCoord);
		}
		for (let drawable of this.drawables) {
			if (drawable.onMouseMove) drawable.onMouseMove(this.mouseCoord);
		}
	}

	onMouseLeftClick(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;

		for (let containerName of this.containers.keys()) {
			const container = this.containers.get(containerName);
			const slot = container?.onMouseLeftClick(this.mouseCoord);
			if (slot) {
				if (this.rules.onCardClick) {
					const card = slot.getCard();
					if (card) this.rules.onCardClick(this, card);
				}
				if (this.rules.onSlotClick) {
					this.rules.onSlotClick(this, slot);
				}
				return;
			}
		}
		this.hand.onMouseLeftClick(this.mouseCoord);

		if (this.rules.onInterfaceClick) {
			for (let drawable of this.drawables) {
				if (drawable.onMouseLeftClick) {
					const action = drawable.onMouseLeftClick(this.mouseCoord);
					if (action) this.rules.onInterfaceClick(this, action, this.mouseCoord)

				}
			}
		}
	}

	onMouseLeftClickRelease(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;

		for (let containerName of this.containers.keys()) {
			const container = this.containers.get(containerName);
			container?.onMouseLeftClickRelease(this.mouseCoord);
		}
		this.hand.onLeftMouseClickRelease(this.mouseCoord);
	}

	__debugAddHand() {
		this.hand.addCard(this.cardLib.getCard("empty")!);
	}

	registerContainer(name: string, container: CardContainer<any>) {
		this.containers.set(name, container);
	}

	getContainer<T>(name: string): CardContainer<T> | undefined {
		return this.containers.get(name);
	}

	addDrawable(drawable: InterfaceDrawable<unknown>) {
		this.drawables.push(drawable);
	}

	cleanDrawables() {
		this.drawables = [];
	}

	moveCard(card: Card, fromContainer: string, toContainer: string): boolean {
		const container1 = this.getContainer(fromContainer);
		const container2 = this.getContainer(toContainer);
		if (!container1 || !container2) return false;

		const slot = container1.removeCard(card);
		if (!slot) return false;

		const oldPos = {x: slot.coord.x, y: slot.coord.y};
		container2.addCard(slot);
		card.deal({x: oldPos.x - slot.coord.x, y: oldPos.y - slot.coord.y});
		return true;
	}
}

