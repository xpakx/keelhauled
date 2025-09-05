export class AudioController {
	private context: AudioContext;
	private buffers: Map<string, AudioBuffer> = new Map();
	private activeSources: Set<AudioBufferSourceNode> = new Set();

	constructor() {
		this.context = new AudioContext();
	}

	async load(url: string, name: string) {
		const res = await fetch(url);
		const arrayBuffer = await res.arrayBuffer();
		const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
		this.buffers.set(name, audioBuffer);
	}

	play(name: string, options?: PlayOptions) {
		const buffer = this.buffers.get(name);
		if (!buffer) throw new Error(`Audio '${name}' not loaded!`);

		const ctx = this.context;
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = options?.loop ?? false;
		source.playbackRate.value = options?.playbackRate ?? 1;

		const gainNode = ctx.createGain();
		gainNode.gain.value = options?.volume ?? 1;

		source.connect(gainNode).connect(ctx.destination);
		if (options?.offset) {
			source.start(0, options.offset);
		} else {
			source.start();
		}
		this.activeSources.add(source);
		return source;
	}

	stopAll() {
		const ctx = this.context;
		this.activeSources.forEach(source => {
			const gainNode = source.context.createGain();
			source.disconnect();
			source.connect(gainNode).connect(ctx.destination);
			source.stop();
		});
		this.activeSources.clear();
	}
}

export interface PlayOptions {
	volume?: number;
	loop?: boolean;
	playbackRate?: number;
	offset?: number;
}
