// @ts-check
const banner = `/**
 * Squix - a Ludum Dare 42 Entry by Arthur Langereis (@zenmumbler)
 * https://github.com/zenmumbler/LD42
 */`;

export default [
	{
		input: "build/ld42.js",
		output: [
			{
				file: "dist/ld42.js",
				format: "es",
				intro: banner
			},
		],
		plugins: [
		]
	}
];
