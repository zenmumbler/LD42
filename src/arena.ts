/**
 * Blarbs - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 */

import { ConstEnumArray8View } from "@stardazed/array";

export const STICKS_PER_ROW = 8;
export const STICK_COLS = 9;

const GRID_W = (STICKS_PER_ROW * 2) - 1;
const GRID_H = STICK_COLS;

const GRID_PAD = 2;

export const ARENA_W = GRID_W + (GRID_PAD * 2);
export const ARENA_H = GRID_H + (GRID_PAD * 2);

export const enum Stick {
	None = 0,
	Horiz = 1,
	Vert = 2,
	OrientMask = 3,
	Frozen = 0x80
}

export const enum Direction {
	LEFT,
	RIGHT,
	UP,
	DOWN
}

export class Arena {
	private sticks_: ConstEnumArray8View<Stick>;

	constructor() {
		this.sticks_ = new Uint8Array(STICKS_PER_ROW * GRID_H);
		this.resetSticks();
	}

	private stickArrayOffset(x: number, y: number) {
		x -= GRID_PAD;
		y -= GRID_PAD;
		if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) {
			return -1;
		}
		// the stick are laid out in a staggered grid, with 0,0 having a value
		if ((x ^ y) & 1) {
			return -1;
		}

		// align odd rows with even ones, as first stick there starts offset by 1
		if (y & 1) {
			x -= 1;
		}
		// each row has a stick every other cell
		x >>= 1;
		return (y * STICKS_PER_ROW) + x;
	}

	resetSticks() {
		const _ = Stick.None;
		const H = Stick.Horiz | Stick.Frozen;
		const V = Stick.Vert | Stick.Frozen;
		// tslint:disable:indent
		this.sticks_.set([
			V, V, V, H, H, V, H, V,
			  H, H, V, H, V, V, V, _,
			H, V, V, V, V, H, V, H,
			  H, V, H, H, V, H, H, _,
			H, H, V, H, H, H, V, H,
			  V, H, V, H, V, H, V, _,
			V, V, H, V, V, V, H, V,
			  V, H, H, V, V, V, H, _,
			H, V, H, H, V, V, V, H,
		]);
		// tslint:enable:indent
	}

	stickAt(x: number, y: number): Stick {
		const offset = this.stickArrayOffset(x, y);
		if (offset < 0) {
			return Stick.None;
		} 
		return this.sticks_[offset];
	}

	setStickAt(x: number, y: number, stick: Stick) {
		const offset = this.stickArrayOffset(x, y);
		if (offset > -1) {
			this.sticks_[offset] = stick;			
		} 
	}

	rotateStickAt(x: number, y: number) {
		let cur = this.stickAt(x, y);
		if (cur & Stick.Frozen) {
			return false;
		}
		cur = cur & Stick.OrientMask;
		if (cur !== Stick.None) {
			this.setStickAt(x, y, Stick.OrientMask - cur);
			return true;
		}
		return false;
	}

	stickCoordAffectingLeft(x: number, y: number) {
		x -= GRID_PAD - 1;
		y -= GRID_PAD - 1;
		if (x < 1 || y < 0 || x > GRID_W || y > GRID_H) {
			return undefined;
		}
		const stickY = y + ((x ^ y) & 1) | (x & 1);
		return [x + GRID_PAD - 1, stickY + GRID_PAD - 1];
	}

	stickCoordAffectingRight(x: number, y: number) {
		x -= GRID_PAD - 1;
		y -= GRID_PAD - 1;
		if (x < 0 || y < 0 || x >= GRID_W || y > GRID_H) {
			return undefined;
		}
		const stickY = y + (~(x ^ y) & 1) | (~x & 1);
		return [x + GRID_PAD, stickY + GRID_PAD - 1];
	}

	stickCoordAffectingUp(x: number, y: number) {
		x -= GRID_PAD - 1;
		y -= GRID_PAD - 1;
		if (x < 0 || y < 1 || x > GRID_W || y > GRID_H) {
			return undefined;
		}
		const stickX = ((x + (~y & 1)) & ~1) + (y & 1);
		return [stickX + GRID_PAD - 1, y + GRID_PAD - 1];
	}

	stickCoordAffectingDown(x: number, y: number) {
		x -= GRID_PAD - 1;
		y -= GRID_PAD - 1;
		if (x < 0 || y < 0 || x > GRID_W || y >= GRID_H) {
			return undefined;
		}
		const stickX = ((x + (y & 1)) & ~1) + (~y & 1);
		return [stickX + GRID_PAD - 1, y + GRID_PAD];
	}

	stickCoordAffectingDirection(x: number, y: number, dir: Direction) {
		if (dir === Direction.LEFT) { return this.stickCoordAffectingLeft(x, y); }
		if (dir === Direction.RIGHT) { return this.stickCoordAffectingRight(x, y); }
		if (dir === Direction.UP) { return this.stickCoordAffectingUp(x, y); }
		if (dir === Direction.DOWN) { return this.stickCoordAffectingDown(x, y); }
		return undefined;
	}

	/**
	 * Given an entity that is 1x1 tile in size, can it
	 * move LEFT from the tile with top left corner at x,y?
	 */
	canMoveLeft(x: number, y: number) {
		if (x <= 0) {
			return false;
		}
		const stickCoord = this.stickCoordAffectingLeft(x, y);
		if (stickCoord === undefined) {
			return true;
		}

		const stick = this.stickAt(stickCoord[0], stickCoord[1]);
		if ((stick & Stick.OrientMask) === Stick.Vert && (stick & Stick.Frozen)) {
			return false;
		}

		return true;
	}

	/**
	 * Given an entity that is 1x1 tile in size, can it
	 * move RIGHT from the tile with top left corner at x,y?
	 */
	canMoveRight(x: number, y: number) {
		if (x >= ARENA_W - GRID_PAD) {
			return false;
		}
		const stickCoord = this.stickCoordAffectingRight(x, y);
		if (stickCoord === undefined) {
			return true;
		}

		const stick = this.stickAt(stickCoord[0], stickCoord[1]);
		if ((stick & Stick.OrientMask) === Stick.Vert && (stick & Stick.Frozen)) {
			return false;
		}

		return true;
	}

	/**
	 * Given an entity that is 1x1 tile in size, can it
	 * move UP from the tile with top left corner at x,y?
	 */
	canMoveUp(x: number, y: number) {
		if (y <= 0) {
			return false;
		}
		const stickCoord = this.stickCoordAffectingUp(x, y);
		if (stickCoord === undefined) {
			return true;
		}

		const stick = this.stickAt(stickCoord[0], stickCoord[1]);
		if ((stick & Stick.OrientMask) === Stick.Horiz && (stick & Stick.Frozen)) {
			return false;
		}

		return true;
	}

	/**
	 * Given an entity that is 1x1 tile in size, can it
	 * move RIGHT from the tile with top left corner at x,y?
	 */
	canMoveDown(x: number, y: number) {
		if (y >= ARENA_H - GRID_PAD) {
			return false;
		}
		const stickCoord = this.stickCoordAffectingDown(x, y);
		if (stickCoord === undefined) {
			return true;
		}

		const stick = this.stickAt(stickCoord[0], stickCoord[1]);
		if ((stick & Stick.OrientMask) === Stick.Horiz && (stick & Stick.Frozen)) {
			return false;
		}

		return true;
	}

	canMove(x: number, y: number, dir: Direction) {
		if (dir === Direction.LEFT) { return this.canMoveLeft(x, y); }
		if (dir === Direction.RIGHT) { return this.canMoveRight(x, y); }
		if (dir === Direction.UP) { return this.canMoveUp(x, y); }
		if (dir === Direction.DOWN) { return this.canMoveDown(x, y); }
		return false;
	}
}
