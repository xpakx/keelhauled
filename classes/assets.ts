
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

	static async splitGridImage(
		img: HTMLImageElement,
		rows: number,
		cols: number): Promise<HTMLImageElement[]> {
		const cellWidth = img.width / cols;
		const cellHeight = img.height / rows;
		const cells: Promise<HTMLImageElement>[] = [];

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const canvas = new OffscreenCanvas(cellWidth, cellHeight);
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("No 2D context!");
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(
					img,
					x * cellWidth, y * cellHeight,
					cellWidth, cellHeight,
					0, 0,
					cellWidth, cellHeight
				);

				const promise = canvas
					.convertToBlob()
					.then(async blob => {
						const url = URL.createObjectURL(blob!);
						const img = await Assets.loadImage(url);
						URL.revokeObjectURL(url);
						return img;
					});

				cells.push(promise);
			}
		}

		return Promise.all(cells);
	}

	static async loadImages(map: { [name: string]: string }
			       ): Promise<Map<string, HTMLImageElement>> {
		const entries = await Promise.all(
			Object.entries(map)
				.map(async ([name, url]) => {
					const img = await Assets.loadImage(url);
					return [name, img] as const;
				})
		);
		return new Map(entries);
	}

	static async loadJSON<T = any>(url: string): Promise<T> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Failed to load JSON from ${url}`);
		return res.json() as Promise<T>;
	}

	// TODO?: audio
}
