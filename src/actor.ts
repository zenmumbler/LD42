import { Direction } from "./arena";

export const enum ActorType {
	Player,
	Mipmip,
}

export interface Actor {
	type: ActorType;
	active: boolean;
	x: number;
	y: number;
	nextDir: Direction | undefined;
}

function movementForDirection(dir: Direction) {
	switch (dir) {
		case Direction.LEFT: return { dx: -1, dy: 0 };
		case Direction.RIGHT: return { dx: 1, dy: 0 };
		case Direction.UP: return { dx: 0, dy: -1 };
		case Direction.DOWN: return { dx: 0, dy: 1 };
	}
}

export function makeActor(type: ActorType): Actor {
	const actor: Actor = {
		type,
		active: false,
		x: 0,
		y: 0,
		nextDir: undefined
	};
	return actor;
}

export function spawnActor(actor: Actor, x: number, y: number) {
	actor.x = x;
	actor.y = y;
	actor.active = true;
}

export function moveActor(actor: Actor, dir: Direction) {
	const { dx, dy } = movementForDirection(dir);
	actor.x += dx;
	actor.y += dy;
}
