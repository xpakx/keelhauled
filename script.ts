import { AudioController } from "./classes/audio.js";
import { CardLibrary } from "./classes/card-lib.js";
import { Game } from "./classes/game.js";
import { getMafiaLibrary, MafiaCardLoader, MafiaRules } from "./classes/examples/mafia.js";
import { CardLoader, DebugRules, DefaultCardLoader, Rules, TraditionalDeckCardLoader } from "./classes/rules.js";
import { PairGameCardLoader, PairsMemoryGameRules } from "./classes/examples/memory.js";
import { HeartsRules } from "./classes/examples/hearts.js";

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

	let cardLib = nameToLibrary(rulesName);
	let cardLoader = nameToLoader(rulesName);
	await cardLoader.load(cardLib);

	let game = new Game(context, canvas, cardLib, nameToRules(rulesName));

	if (rulesName === "mafia" ) {
		let sound = new AudioController();
		await sound.load("audio/flip.mp3", "flip");
		await sound.load("audio/hit.mp3", "hit");
		game.setSound(sound);
	}

	const frame = (timestamp: number) => {
		game.nextFrame(timestamp);
		window.requestAnimationFrame(frame);
	};

	window.requestAnimationFrame((timestamp) => {
		game.timestamp = timestamp;
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
		case "mafia": 
			return new MafiaRules();
		case "hearts": 
			return new HeartsRules();
		case "memory": 
		case "memoryTrad": 
		default:
			return new PairsMemoryGameRules();

	}
}


function nameToLoader(name: string): CardLoader {
	switch (name) {
		case "memory": 
			return new PairGameCardLoader();
		case "basic": 
			return new DefaultCardLoader();
		case "mafia": 
			return new MafiaCardLoader();
		case "traditional":
		case "memoryTrad": 
		default:
			return new TraditionalDeckCardLoader();

	}
}

function nameToLibrary(name: string): CardLibrary {
	if (name === "mafia") return getMafiaLibrary();
	return new CardLibrary();
}
