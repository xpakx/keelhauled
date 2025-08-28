import { CardLibrary } from "./classes/card-lib.js";
import { Game, Size } from "./classes/game.js";
import { PairsMemoryGameRules } from "./classes/rules.js";

window.onload = async () => {
	const canvas = document.getElementById('gameCanvas') as (HTMLCanvasElement | null);
	if (!canvas) {
		console.log('No canvas elem');
		return;
	}
	const context = canvas.getContext('2d');
	if (!context) {
		console.log("No context");
		return;
	}

	let cardLib = new CardLibrary();
	const cardImage = await loadImage("images/card.png");
	const faceImage = await loadImage("images/empty.png");
	cardLib.setDefaultReverse(cardImage);
	cardLib.registerDefinition("empty", faceImage);
	const colors = ["red", "blue", "green", "yellow", "magenta", "cyan", "black", "gray"];
	for (let color of colors) {
		const image = createCardImage(
			faceImage,
			color,
			{width: 100, height: 100}
		);
		cardLib.registerDefinition(color, image);
	}

	let game = new Game(context, canvas, cardLib, new PairsMemoryGameRules());
	game.__debugAddHand();

	const frame = (timestamp: number) => {
		game.nextFrame(timestamp);
		window.requestAnimationFrame(frame);
	};

	window.requestAnimationFrame((timestamp) => {
		game.prevTimestamp = timestamp;
		window.requestAnimationFrame(frame);
	});

	canvas.addEventListener('mousemove', function(event) {
		game.onMouseMove(event);
	});
	canvas.addEventListener('mousedown', (event) => {
		if(event.button == 0) {
			game.onMouseLeftClick(event);
		}
	});
	canvas.addEventListener('mouseup', (event) => {
		if(event.button == 0) {
			game.onMouseLeftClickRelease(event);
		}
	});

}

async function loadImage(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

function createCardImage(
	emptyCard: HTMLImageElement,
	color: string = "#000000",
	size: Size,
): HTMLImageElement {
	const canvas = new OffscreenCanvas(size.width, size.height);
	canvas.width = size.width;
	canvas.height = size.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("No 2D context!");

	ctx.drawImage(emptyCard, 0, 0, size.width, size.height);

	ctx.fillStyle = color;
	ctx.fillRect(10, 10, size.width - 20, size.height - 20);

	const img = new Image();
	canvas.convertToBlob().then(blob => {
		const url = URL.createObjectURL(blob);
		img.src = url;
	});

	return img;
}

