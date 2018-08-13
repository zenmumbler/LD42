export const enum SFX {
	Box,
	Die
}

export const enum Music {
	None,
	Intro,
	Main
}

export interface SoundAssets {
	intro: AudioBuffer;
	music: AudioBuffer;

	box: AudioBuffer;
	die: AudioBuffer;
}

function loadSoundFile(ctx: AudioContext, path: string) {
	return fetch(path, { mode: "cors" })
		.then(resp => resp.arrayBuffer())
		.then(buf => new Promise<AudioBuffer>((resolve, reject) => {
			ctx.decodeAudioData(buf, audioData => {
				resolve(audioData);
			},
			err => {
				reject(`Invalid audio data, error: ${err}`);
			});
		}));
}

export class Sound {
	private assets_: SoundAssets;
	private ctx: AudioContext;

	private plonkGain: GainNode;
	private musicGain: GainNode;
	private effectGain: GainNode;

	private plonkSource: AudioBufferSourceNode | null = null;
	private musicSource: AudioBufferSourceNode | null = null;
	private effectSource: AudioBufferSourceNode | null = null;

	readonly loadedPromise: Promise<void>;
	private loadResolve!: () => void;

	constructor() {
		const ctx = this.ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ latencyHint: "interactive" }) as AudioContext; // muted by default
		this.loadedPromise = new Promise(resolve => this.loadResolve = resolve);
		this.assets_ = {} as SoundAssets;

		this.plonkGain = ctx.createGain();
		this.musicGain = ctx.createGain();
		this.effectGain = ctx.createGain();

		this.plonkGain.connect(ctx.destination);
		this.musicGain.connect(ctx.destination);
		this.effectGain.connect(ctx.destination);

		const todos = [
			loadSoundFile(ctx, "data/intro.mp3").then(ab => this.assets_.intro = ab, err => { console.warn(err); }),
			loadSoundFile(ctx, "data/OutRun - Magical Sound Shower (Euro Remix) 96kHz.mp3").then(ab => this.assets_.music = ab, err => { console.warn(err); }),

			loadSoundFile(ctx, "data/get.mp3").then(ab => this.assets_.box = ab, err => { console.warn(err); }),
			loadSoundFile(ctx, "data/die.mp3").then(ab => this.assets_.die = ab, err => { console.warn(err); }),
		];
		
		Promise.all(todos).then(this.loadResolve);
	}

	activate() {
		this.ctx.resume && this.ctx.resume().catch(err => { alert(`Sorry, can't enable audio.\n${err}`); });
	}

	startMusic(intro: boolean) {
		if (! this.musicSource) {
			this.musicSource = this.ctx.createBufferSource();
			this.musicSource.buffer = intro ? this.assets_.intro : this.assets_.music;
			this.musicSource.loop = true;
			this.musicSource.connect(this.musicGain);
			this.musicGain.gain.value = 0.60;

			this.musicSource.start(0);
		}
	}

	stopMusic() {
		if (this.musicSource) {
			this.musicSource.stop();
			this.musicSource = null;
		}
	}

	play(what: SFX) {
		const assets = this.assets_;

		let buffer: AudioBuffer | null = null;
		let source: AudioBufferSourceNode | null = null;
		let gain: GainNode | null = null;
		let volume = 0;
		let rate: number | null = null;

		// const randomTranspose = (notes: number) => {
		// 	return 1.0 + (-notes + math.intRandomRange(0, notes * 2)) / 12;
		// };

		switch (what) {
			case SFX.Box: buffer = assets.box; source = this.effectSource; gain = this.effectGain; volume = 0.6; rate = 1.0; break;
			// case SFX.Flipper: buffer = assets.flipper; source = this.plonkSource; gain = this.plonkGain; volume = 1.0; rate = 1.0; break;
			// case SFX.Bumper: buffer = assets.bumper; source = this.plonkSource; gain = this.plonkGain; volume = 1.0; rate = randomTranspose(2); break;
			case SFX.Die: buffer = assets.die; source = this.effectSource; gain = this.effectGain; volume = 0.8; rate = 1.0; break;

			default: buffer = null;
		}

		if (!buffer || !gain) {
			return;
		}
		if (source) {
			source.stop();
		}

		let bufferSource: AudioBufferSourceNode | null = this.ctx.createBufferSource();
		bufferSource.buffer = buffer;
		bufferSource.connect(gain);
		if (rate !== null) {
			bufferSource.playbackRate.value = rate;
		}
		bufferSource.start(0);
		gain.gain.value = volume;

		// if (what === SFX.Flipper || what === SFX.Bumper) {
		// 	this.plonkSource = bufferSource;
		// }
		// else {
		this.effectSource = bufferSource;
		// }

		bufferSource.onended = () => {
			if (this.effectSource === bufferSource) {
				this.effectSource = null;
			}
			else if (this.plonkSource === bufferSource) {
				this.plonkSource = null;
			}

			bufferSource!.disconnect();
			bufferSource = null;
		};

	}
}
