/**
 * Blarbs - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 */

import { Arena, ARENA_W, ARENA_H, Stick, Direction, Quad } from "./arena";
import * as dom from "@zenmumbler/mini-dom";
import { SFX, Sound } from "./sfx";

const enum ActorType {
	Player,
	Mipmip,
}

interface Actor {
	type: ActorType;
	elem: HTMLElement;
	x: number;
	y: number;
	nextDir: Direction | undefined;
}

function makeBoxElem(quad: Quad) {
	const [x, y] = arena.topLeftOfQuad(quad);
	const [left, top] = view.pixelCoordForPosition(x, y);
	const el = document.createElement("div");
	el.className = "box";
	el.style.left = `${left}px`;
	el.style.top = `${top}px`;
	root.appendChild(el);
	return el;
}

function makeActor(type: ActorType): Actor {
	const actor: Actor = {
		elem: document.createElement("div"),
		type,
		x: 0,
		y: 0,
		nextDir: undefined
	};
	actor.elem.className = "hidden " + (type === ActorType.Player ? "blarb" : "mipmip");
	root.appendChild(actor.elem);
	return actor;
}

function spawnActor(actor: Actor, x: number, y: number) {
	actor.x = x;
	actor.y = y;
	actor.elem.style.left = `${actor.x * GRID_TILE_DIM}px`;
	actor.elem.style.top = `${actor.y * GRID_TILE_DIM}px`;
	actor.elem.classList.remove("hidden");
	actor.elem.classList.add("actor");
}

function moveActor(actor: Actor, dir: Direction) {
	if (! arena.canMove(actor.x, actor.y, dir)) {
		return;
	}
	const stickCoord = arena.stickCoordAffectingDirection(actor.x, actor.y, dir);
	if (stickCoord) {
		if (dir < Direction.UP) {
			if (arena.stickOrientationAt(stickCoord[0], stickCoord[1]) === Stick.Vert) {
				arena.setStickOrientationAt(stickCoord[0], stickCoord[1], Stick.Horiz);
				const elem = view.stickElemAt(stickCoord[0], stickCoord[1]);
				if (elem) {
					elem.classList.remove("vert");
				}

				const boxCheckDir = (stickCoord[1] <= actor.y) ? Direction.UP : Direction.DOWN;
				const boxQuad = arena.quadRelativeToStickAt(stickCoord[0], stickCoord[1], boxCheckDir);
				if (arena.quadIsBox(boxQuad) && actor.type === ActorType.Player) {
					arena.freezeQuad(boxQuad);
					view.freezeQuad(boxQuad);
					makeBoxElem(boxQuad);
					sound.play(SFX.Box);
				}
			}
		}
		else {
			if (arena.stickOrientationAt(stickCoord[0], stickCoord[1]) === Stick.Horiz) {
				arena.setStickOrientationAt(stickCoord[0], stickCoord[1], Stick.Vert);
				const elem = view.stickElemAt(stickCoord[0], stickCoord[1]);
				if (elem) {
					elem.classList.add("vert");
				}

				const boxCheckDir = (stickCoord[0] <= actor.x) ? Direction.LEFT : Direction.RIGHT;
				const boxQuad = arena.quadRelativeToStickAt(stickCoord[0], stickCoord[1], boxCheckDir);
				if (arena.quadIsBox(boxQuad) && actor.type === ActorType.Player) {
					arena.freezeQuad(boxQuad);
					view.freezeQuad(boxQuad);
					makeBoxElem(boxQuad);
					sound.play(SFX.Box);
				}
			}
		}
	}

	const { dx, dy } = movementForDirection(dir);
	actor.x += dx;
	actor.y += dy;
	actor.elem.style.left = `${actor.x * GRID_TILE_DIM}px`;
	actor.elem.style.top = `${actor.y * GRID_TILE_DIM}px`;
}

const GRID_TILE_DIM = 57;

class ArenaView {
	arena: Arena;
	root: HTMLElement;
	sticks: (HTMLElement | null)[];

	constructor(arena: Arena, rootElem: HTMLElement) {
		this.arena = arena;
		this.root = rootElem;
		this.sticks = [];

		const makeStickElem = (x: number, y: number, stick: Stick) => {
			const elem = document.createElement("div");
			elem.className = `stick ${stick === Stick.Vert ? "vert" : ""}`;

			const coord = this.pixelCoordForPosition(x, y);
			elem.style.left = `${coord[0]}px`;
			elem.style.top = `${coord[1]}px`;

			return elem;
		};

		for (let y = 0; y < ARENA_H; ++y) {
			for (let x = 0; x < ARENA_W; ++x) {
				const stick = arena.stickOrientationAt(x, y);
				if (stick === Stick.None) {
					this.sticks.push(null);
				}
				else {
					const elem = makeStickElem(x, y, stick);
					this.sticks.push(elem);
					this.root.appendChild(elem);
				}
			}
		}
	}

	stickElemAt(x: number, y: number) {
		return this.sticks[(y * ARENA_W) + x];
	}

	freezeQuad(quad: Quad) {
		const t = this.stickElemAt(quad.top[0], quad.top[1]); t && (t.classList.add("frozen"));
		const l = this.stickElemAt(quad.left[0], quad.left[1]); l && (l.classList.add("frozen"));
		const r = this.stickElemAt(quad.right[0], quad.right[1]); r && (r.classList.add("frozen"));
		const b = this.stickElemAt(quad.bottom[0], quad.bottom[1]); b && (b.classList.add("frozen"));
	}

	pixelCoordForPosition(x: number, y: number) {
		return [x * GRID_TILE_DIM, y * GRID_TILE_DIM];
	}
}

enum Key {
	NONE = 0,

	UP = 38,
	DOWN = 40,
	LEFT = 37,
	RIGHT = 39,
}

function movementForDirection(dir: Direction) {
	switch (dir) {
		case Direction.LEFT: return { dx: -1, dy: 0 };
		case Direction.RIGHT: return { dx: 1, dy: 0 };
		case Direction.UP: return { dx: 0, dy: -1 };
		case Direction.DOWN: return { dx: 0, dy: 1 };
	}
}

interface Rhythm {
	lastMove: number;
	interval: number;
}

let root: HTMLElement;
let arena: Arena;
let view: ArenaView;
let sound: Sound;
let blarb: Actor;
let mipmip: Actor;
let rhythm: Rhythm;
let mode: "load" | "intro" | "game" | "lose" | "win" = "load";

function show(sel: string) {
	dom.$1(sel).classList.remove("hidden");
}
function hide(sel: string) {
	dom.$1(sel).classList.add("hidden");
}

function setMode(newMode: "load" | "intro" | "game" | "lose" | "win") {
	if (newMode === "game") {
		rhythm.lastMove = performance.now();
		hide(".intro");
		sound.stopMusic();
		sound.startMusic(false);
		spawnActor(blarb, 3, 0);
		spawnActor(mipmip, ARENA_W - 2, 7);
	}
	if (newMode === "intro") {
		sound.stopMusic();
		sound.startMusic(true);
	}
	mode = newMode;
}

export function start(fullscreen: boolean) {
	sound.activate();
	hide(".launch");
	show(".status");
	show(".arena");
	setMode("intro");
	if (fullscreen) {
		// const el = dom.$1(".game") as any;
		// (el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen).call(el);
	}
}

function nextMipDir() {
	const dx = blarb.x - mipmip.x;
	const dy = blarb.y - mipmip.y;

	const chase = Math.random() < 0.65;
	const r = Math.random();
	if (r < 0.5) {
		if (chase) {
			return dx > 0 ? Direction.RIGHT : Direction.LEFT;
		}
		return Math.random() < 0.5 ? Direction.RIGHT : Direction.LEFT;
	}
	else {
		if (chase) {
			return dy > 0 ? Direction.DOWN : Direction.UP;
		}
		return Math.random() < 0.5 ? Direction.DOWN : Direction.UP;
	}
}

let controlDir: Direction | undefined;

export function main() {
	root = dom.$1(".arena");
	rhythm = { lastMove: 0, interval: 0.46875 * 1000 / 2 };
	sound = new Sound();
	arena = new Arena();
	view = new ArenaView(arena, root);
	(window as any).view = view;

	blarb = makeActor(ActorType.Player);
	mipmip = makeActor(ActorType.Mipmip);

	const next = () => {
		if (mode === "game") {
			const now = performance.now();
			const nextMove = rhythm.lastMove + rhythm.interval;
			if (now > nextMove) {
				rhythm.lastMove = now;
				const nextBlarbDir = controlDir === undefined ? blarb.nextDir : controlDir;
				if (nextBlarbDir !== undefined) {
					moveActor(blarb, nextBlarbDir);
					blarb.nextDir = undefined;
				}
				mipmip.nextDir = nextMipDir();
				if (mipmip.nextDir !== undefined) {
					moveActor(mipmip, mipmip.nextDir);
				}
				if (mipmip.x === blarb.x && mipmip.y === blarb.y) {
					sound.play(SFX.Die);
					spawnActor(blarb, 3, 0);
					spawnActor(mipmip, ARENA_W - 2, 7);
				}
			}
		}

		window.requestAnimationFrame(next);
	};

	window.requestAnimationFrame(next);

	document.onkeydown = (evt) => {
		if (! (evt.metaKey || evt.ctrlKey)) {
			evt.preventDefault();
		}
		if (evt.repeat) {
			return;
		}
		if (mode === "intro") {
			if (evt.keyCode === 32) {
				setMode("game");
			}
		}
		else if (mode === "game") {
			switch (evt.keyCode) {
				case Key.UP: blarb.nextDir = controlDir = Direction.UP; break;
				case Key.DOWN: blarb.nextDir = controlDir = Direction.DOWN; break;
				case Key.LEFT: blarb.nextDir = controlDir = Direction.LEFT; break;
				case Key.RIGHT: blarb.nextDir = controlDir = Direction.RIGHT; break;
			}
		}
	};

	document.onkeyup = (evt) => {
		if (mode === "game") {
			switch (evt.keyCode) {
				case Key.UP: if (controlDir === Direction.UP) { controlDir = undefined; } break;
				case Key.DOWN: if (controlDir === Direction.DOWN) { controlDir = undefined; } break;
				case Key.LEFT: if (controlDir === Direction.LEFT) { controlDir = undefined; } break;
				case Key.RIGHT: if (controlDir === Direction.RIGHT) { controlDir = undefined; } break;
			}
		}
	};

	return sound.loadedPromise; // yep
}

