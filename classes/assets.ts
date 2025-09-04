
export class Assets {

	constructor() {
		throw new Error('Assets is a static class and cannot be instantiated');
	}

	static async loadImage(url: string): Promise<HTMLImageElement> {
		const image = new Image();
		image.src = url;
		return new Promise((resolve, reject) => {
			image.onload = () => resolve(image);
			image.onerror = reject;
		});
	}

	static async splitGridImage(img: HTMLImageElement, rows: number, cols: number) {
		const cellWidth = img.width / cols;
		const cellHeight = img.height / rows;
		const cells = [];
		const canvas = new OffscreenCanvas(cellWidth, cellHeight);
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2D context!");

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(
					img,
					x * cellWidth, y * cellHeight,
					cellWidth, cellHeight,
					0, 0,
					cellWidth, cellHeight
				);

				const blob = await canvas.convertToBlob();
				const cellImg = new Image();
				cellImg.src = URL.createObjectURL(blob);
				cellImg.onload = () => URL.revokeObjectURL(cellImg.src);
				cells.push(cellImg);
			}
		}

		return cells;
	}
}
