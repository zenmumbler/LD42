import { Arena, Stick, ARENA_W, ARENA_H, Quad } from "./arena";
import { Actor, ActorType } from "./actor";

export const GRID_TILE_DIM = 57;

class ActorView {
	actor: Actor;
	elem: HTMLElement;
	activated: boolean;

	constructor(actor: Actor, arenaView: ArenaView) {
		this.actor = actor;
		this.elem = document.createElement("div");
		this.elem.className = "hidden " + (actor.type === ActorType.Player ? "blarb" : "mipmip");
		this.activated = false;
		arenaView.root.appendChild(this.elem);
	}

	update() {
		const { elem, actor } = this;
		elem.style.left = `${actor.x * GRID_TILE_DIM}px`;
		elem.style.top = `${actor.y * GRID_TILE_DIM}px`;
		if (actor.active !== this.activated) {
			if (actor.active) {
				elem.classList.add("actor");
				elem.classList.remove("hidden");
			}
			else {
				elem.classList.remove("actor");
				elem.classList.add("hidden");
			}
			this.activated = actor.active;
		}
	}
}

export class ArenaView {
	arena: Arena;
	root: HTMLElement;
	actors: ActorView[];
	sticks: (HTMLElement | null)[];
	boxes: HTMLElement[];

	constructor(arena: Arena, rootElem: HTMLElement) {
		this.arena = arena;
		this.root = rootElem;
		this.actors = [];
		this.sticks = [];
		this.boxes = [];
		this.addSticks();
	}

	pixelCoordForPosition(x: number, y: number) {
		return [x * GRID_TILE_DIM, y * GRID_TILE_DIM];
	}

	stickElemAt(x: number, y: number) {
		return this.sticks[(y * ARENA_W) + x];
	}

	addSticks() {
		const makeStick = (x: number, y: number, stick: Stick) => {
			const elem = document.createElement("div");
			elem.className = "stick " + (stick === Stick.Vert ? "vert" : "");
	
			const coord = this.pixelCoordForPosition(x, y);
			elem.style.left = `${coord[0]}px`;
			elem.style.top = `${coord[1]}px`;
	
			return elem;
		};
	
		for (let y = 0; y < ARENA_H; ++y) {
			for (let x = 0; x < ARENA_W; ++x) {
				const stick = this.arena.stickOrientationAt(x, y);
				if (stick === Stick.None) {
					this.sticks.push(null);
				}
				else {
					const elem = makeStick(x, y, stick);
					this.sticks.push(elem);
					this.root.appendChild(elem);
				}
			}
		}
	}

	updateStickAt(x: number, y: number) {
		const stick = this.arena.stickAt(x, y);
		const elem = this.sticks[y * ARENA_W + x];
		if ((stick !== Stick.None) && elem) {
			if ((stick & Stick.OrientMask) === Stick.Vert) {
				elem.classList.add("vert");
			}
			else {
				elem.classList.remove("vert");
			}
			elem.classList.toggle("frozen", (stick & Stick.Frozen) !== 0);
		}
	}

	updateQuad(quad: Quad) {
		this.updateStickAt(quad.top[0], quad.top[1]);
		this.updateStickAt(quad.left[0], quad.left[1]);
		this.updateStickAt(quad.right[0], quad.right[1]);
		this.updateStickAt(quad.bottom[0], quad.bottom[1]);
	}

	updateAllSticks() {
		for (let y = 0; y < ARENA_H; ++y) {
			for (let x = 0; x < ARENA_W; ++x) {
				this.updateStickAt(x, y);
			}
		}
	}

	addBox(quad: Quad) {
		const [x, y] = this.arena.topLeftOfQuad(quad);
		const [left, top] = this.pixelCoordForPosition(x, y);
		const el = document.createElement("div");
		el.className = "box";
		el.style.left = `${left}px`;
		el.style.top = `${top}px`;
		this.root.appendChild(el);
		this.boxes.push(el);
		return el;
	}

	addViewForActor(actor: Actor) {
		this.actors.push(new ActorView(actor, this));
	}

	updateActors() {
		for (const av of this.actors) {
			av.update();
		}
	}
}
