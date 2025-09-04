import { CardLibrary } from "./classes/card-lib.js";
import { Game } from "./classes/game.js";
import { CardLoader, DebugRules, DefaultCardLoader, PairGameCardLoader, PairsMemoryGameRules, Rules, TraditionalDeckCardLoader } from "./classes/rules.js";

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

	const params = new URLSearchParams(window.location.search);
	const rulesName = params.get("rules") || "memory"; 
	const loaderName = params.get("loader") || "traditional"; 

	let cardLib = new CardLibrary();
	let cardLoader = nameToLoader(loaderName);
	await cardLoader.load(cardLib);

	let game = new Game(context, canvas, cardLib, nameToRules(rulesName));

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

function nameToRules(name: string): Rules {
	switch (name) {
		case "debug": 
			return new DebugRules();
		case "memory": 
			return new PairsMemoryGameRules();
		default:
			return new PairsMemoryGameRules();

	}
}


function nameToLoader(name: string): CardLoader {
	switch (name) {
		case "traditional": 
			return new TraditionalDeckCardLoader();
		case "memory": 
			return new PairGameCardLoader();
		case "basic": 
			return new DefaultCardLoader();
		default:
			return new TraditionalDeckCardLoader();

	}
}
