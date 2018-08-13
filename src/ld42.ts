/**
 * Blarbs - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 */

import { Arena, ARENA_W, ARENA_H, Stick, Direction } from "./arena";

const enum Actor {
	Player,
	Mipmip,
	Slurf
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

	pixelCoordForPosition(x: number, y: number) {
		return [x * GRID_TILE_DIM, y * GRID_TILE_DIM];
	}

	horizontalMotion(x1: number, x2: number, y: number, actor: Actor) {

	}
	verticalMotion(x: number, y1: number, y2: number, actor: Actor) {

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

export function main() {
	const root = document.querySelector(".arena")! as HTMLElement;
	const arena = new Arena();
	const view = new ArenaView(arena, root);
	(window as any).view = view;

	let blarbX = 0;
	let blarbY = 0;
	const blarb = document.createElement("div");
	blarb.className = "actor blarb";
	root.appendChild(blarb);

	const move = (dir: Direction) => {
		if (! arena.canMove(blarbX, blarbY, dir)) {
			return;
		}
		const stickCoord = arena.stickCoordAffectingDirection(blarbX, blarbY, dir);
		if (stickCoord) {
			if (dir < Direction.UP) {
				if (arena.stickOrientationAt(stickCoord[0], stickCoord[1]) === Stick.Vert) {
					arena.setStickOrientationAt(stickCoord[0], stickCoord[1], Stick.Horiz);
					const elem = view.stickElemAt(stickCoord[0], stickCoord[1]);
					if (elem) {
						elem.classList.remove("vert");
					}

					const boxCheckDir = (stickCoord[1] <= blarbY) ? Direction.UP : Direction.DOWN;
					const boxQuad = arena.quadRelativeToStickAt(stickCoord[0], stickCoord[1], boxCheckDir);
					if (arena.quadIsBox(boxQuad)) {
						console.info("BOX! ^v");
						arena.freezeQuad(boxQuad);
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

					const boxCheckDir = (stickCoord[0] <= blarbX) ? Direction.LEFT : Direction.RIGHT;
					const boxQuad = arena.quadRelativeToStickAt(stickCoord[0], stickCoord[1], boxCheckDir);
					if (arena.quadIsBox(boxQuad)) {
						console.info("BOX! <>");
						arena.freezeQuad(boxQuad);
					}
				}
			}
		}

		const { dx, dy } = movementForDirection(dir);
		blarbX += dx;
		blarbY += dy;
		blarb.style.left = `${blarbX * GRID_TILE_DIM}px`;
		blarb.style.top = `${blarbY * GRID_TILE_DIM}px`;
	};

	document.onkeydown = (evt) => {
		switch (evt.keyCode) {
			case Key.UP: move(Direction.UP); break;
			case Key.DOWN: move(Direction.DOWN); break;
			case Key.LEFT: move(Direction.LEFT); break;
			case Key.RIGHT: move(Direction.RIGHT); break;
		}
	};
}
