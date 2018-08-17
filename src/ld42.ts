/**
 * Blarbs - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 */

import * as dom from "@zenmumbler/mini-dom";
import { Arena, ARENA_W, ARENA_H, Direction, Stick } from "./arena";
import { SFX, Sound } from "./sfx";
import { Actor, ActorType, makeActor, spawnActor, moveActor } from "./actor";
import { ArenaView } from "./view";

enum Key {
	NONE = 0,

	UP = 38,
	DOWN = 40,
	LEFT = 37,
	RIGHT = 39,
}

interface Rhythm {
	firstMove: number;
	moveCount: number;
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
		rhythm.firstMove = performance.now();
		rhythm.moveCount = 0;
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

function oppositeDir(dir: Direction) {
	if (dir === Direction.UP) { return Direction.DOWN; }
	if (dir === Direction.DOWN) { return Direction.UP; }
	if (dir === Direction.LEFT) { return Direction.RIGHT; }
	return Direction.LEFT;
}

function nextMipDir() {
	const dx = blarb.x - mipmip.x;
	const dy = blarb.y - mipmip.y;

	const upOK = arena.canMoveUp(mipmip.x, mipmip.y);
	const downOK = arena.canMoveDown(mipmip.x, mipmip.y);
	const leftOK = arena.canMoveLeft(mipmip.x, mipmip.y);
	const rightOK = arena.canMoveRight(mipmip.x, mipmip.y);
	const horizOK = leftOK || rightOK;
	const vertOK = upOK || downOK;

	const chase = Math.random() < 0.92;
	if (chase) {
		if ((Math.random() < 0.5 && vertOK) || !horizOK) {
			if ((dy > 0 && downOK) || !upOK) {
				return Direction.DOWN;
			}
			else {
				return Direction.UP;
			}
		}
		else {
			if ((dx > 0 && rightOK) || !leftOK) {
				return Direction.RIGHT;
			}
			else {
				return Direction.LEFT;
			}
		}
	}

	const r = Math.random();
	if ((r < 0.5 && horizOK) || !vertOK) {
		return (Math.random() < 0.5 && rightOK) ? Direction.RIGHT : Direction.LEFT;
	}
	else {
		return (Math.random() < 0.5 && downOK) ? Direction.DOWN : Direction.UP;
	}
}

let controlDir: Direction | undefined;

function performActorMove(actor: Actor, dir: Direction) {
	if (! arena.canMove(actor.x, actor.y, dir)) {
		return;
	}

	const stickCoord = arena.stickCoordAffectingDirection(actor.x, actor.y, dir);
	if (stickCoord) {
		let stickCheckOrient: Stick;
		let boxCheckDir: Direction;

		if (dir < Direction.UP) {
			stickCheckOrient = Stick.Vert;
			boxCheckDir = (stickCoord[1] <= actor.y) ? Direction.UP : Direction.DOWN;
		}
		else {
			stickCheckOrient = Stick.Horiz;
			boxCheckDir = (stickCoord[0] <= actor.x) ? Direction.LEFT : Direction.RIGHT;
		}

		if (arena.stickOrientationAt(stickCoord[0], stickCoord[1]) === stickCheckOrient) {
			arena.toggleStickOrientationAt(stickCoord[0], stickCoord[1]);
			view.updateStickAt(stickCoord[0], stickCoord[1]);

			const boxQuad = arena.quadRelativeToStickAt(stickCoord[0], stickCoord[1], boxCheckDir);
			if (arena.quadIsBox(boxQuad) && actor.type === ActorType.Player) {
				arena.freezeQuad(boxQuad);
				view.updateQuad(boxQuad);
				view.addBox(boxQuad);
				sound.play(SFX.Box);
			}
		}
	}

	moveActor(actor, dir);
}

export function main() {
	root = dom.$1(".arena");
	rhythm = { firstMove: 0, moveCount: 0, interval: 0.46875 * 1000 / 2 };
	sound = new Sound();
	arena = new Arena();
	view = new ArenaView(arena, root);
	(window as any).view = view;

	blarb = makeActor(ActorType.Player);
	mipmip = makeActor(ActorType.Mipmip);
	view.addViewForActor(blarb);
	view.addViewForActor(mipmip);

	const next = () => {
		if (mode === "game") {
			const now = performance.now();
			const nextMove = rhythm.firstMove + (rhythm.moveCount * rhythm.interval);
			if (now > nextMove) {
				rhythm.moveCount++;
				const nextBlarbDir = controlDir === undefined ? blarb.nextDir : controlDir;
				if (nextBlarbDir !== undefined) {
					performActorMove(blarb, nextBlarbDir);
					blarb.nextDir = undefined;
				}
				mipmip.nextDir = nextMipDir();
				if (mipmip.nextDir !== undefined) {
					performActorMove(mipmip, mipmip.nextDir);
				}
				if (mipmip.x === blarb.x && mipmip.y === blarb.y) {
					sound.play(SFX.Die);
					spawnActor(blarb, 3, 0);
					spawnActor(mipmip, ARENA_W - 2, 7);
				}
				view.updateActors();
			}
		}

		window.requestAnimationFrame(next);
	};
	next();

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

