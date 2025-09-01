import { CardLibrary } from "./classes/card-lib.js";
import { Game } from "./classes/game.js";
import { DebugRules, PairGameCardLoader, PairsMemoryGameRules, TraditionalDeckCardLoader } from "./classes/rules.js";

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
	let cardLoader = new TraditionalDeckCardLoader();
	await cardLoader.load(cardLib);

	let game = new Game(context, canvas, cardLib, new DebugRules());

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
