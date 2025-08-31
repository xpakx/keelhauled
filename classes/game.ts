import { CardLibrary } from "./card-lib.js";
import { Grid } from "./grid.js";
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

	grid: Grid = new Grid();

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

	nextFrame(timestamp: number) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.grid.nextFrame(timestamp, this.context);
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
			console.log("Game Over!", this.rules.getState?.());
		}
	}

	setCanvasSize(size: Size) {
		this.canvas.width = size.width;
		this.canvas.height = size.height;
	}

	setGridSize(size: Size) {
		this.grid.setGridSize(
			size,
			{width: this.canvas.width, height: this.canvas.height},
			this.cardLib,
			this.rules,
		);
	}

	onMouseMove(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		this.grid.onMouseMove(this.mouseCoord);
	}

	onMouseLeftClick(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		const card = this.grid.onMouseLeftClick(this.mouseCoord);
		if (card) {
			this.rules.onCardClick(this, card);
		} else {
			this.hand.onMouseLeftClick(this.mouseCoord);
		}
	}

	onMouseLeftClickRelease(event: MouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseCoord.x = event.clientX - rect.left;
		this.mouseCoord.y = event.clientY - rect.top;
		this.grid.onMouseLeftClickRelease(this.mouseCoord);
		this.hand.onLeftMouseClickRelease(this.mouseCoord);
	}

	__debugAddHand() {
		this.hand.addCard(this.cardLib.getCard("empty")!);
	}
}
