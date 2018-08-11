/**
 * Squix - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 */

import { plop } from "./field";

export function main() {
	const canvas = document.querySelector("canvas")!;
	const ctx = canvas.getContext("2d");
	plop();
}
