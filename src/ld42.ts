/**
 * Blarbs - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 */

import { Arena, ARENA_W, ARENA_H, Stick } from "./arena";

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

	const move = (dx: number, dy: number) => {
		blarbX += dx;
		blarbY += dy;
		blarb.style.left = `${blarbX * GRID_TILE_DIM}px`;
		blarb.style.top = `${blarbY * GRID_TILE_DIM}px`;
	};
	move(0, 0);

	document.onkeydown = (evt) => {
		switch (evt.keyCode) {
			case Key.UP: if (arena.canMoveUp(blarbX, blarbY)) { move(0, -1); } break;
			case Key.DOWN: if (arena.canMoveDown(blarbX, blarbY)) { move(0, 1); } break;
			case Key.LEFT: if (arena.canMoveLeft(blarbX, blarbY)) { move(-1, 0); } break;
			case Key.RIGHT: if (arena.canMoveRight(blarbX, blarbY)) { move(1, 0); } break;
		}
	};
}
