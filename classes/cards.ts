import { Card } from "./card.js";

export class Cards {

	constructor() {
		throw new Error('Cards is a static class and cannot be instantiated');
	}

	static getStrongestCard(cards: string[], suit: string): string {
		let currentStrongest: string = "";
		let currentStrongestOrder = -1;
		const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
		for (let card of cards) {
			if (suit !== Cards.getSuit(card)) continue;
			const order = rankOrder.indexOf(Cards.getRank(card));
			if (order > currentStrongestOrder) {
				currentStrongestOrder = order;
				currentStrongest = card;
			}
		}
		return currentStrongest;
	}

	static getSuit(card: string | Card): string {
		const cardName = typeof card === "string" ? card : card.name;
		return cardName[cardName.length-1];
	}

	static getRank(card: string | Card): string {
		const cardName = typeof card === "string" ? card : card.name;
		return cardName.slice(0, cardName.length-1);
	}
}
