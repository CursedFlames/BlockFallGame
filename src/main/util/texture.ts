import * as PIXI from "pixi.js";

function createBlackTexture() {
	const canvas = document.createElement('canvas');

	canvas.width = 16;
	canvas.height = 16;

	const context = canvas.getContext('2d')!;

	context.fillStyle = 'black';
	context.fillRect(0, 0, 16, 16);

	return new PIXI.Texture(new PIXI.BaseTexture(new PIXI.resources.CanvasResource(canvas)));
}

function createMissingTexture() {
	const canvas = document.createElement('canvas');

	canvas.width = 16;
	canvas.height = 16;

	const context = canvas.getContext('2d')!;

	context.fillStyle = 'black';
	context.fillRect(0, 0, 8, 8);
	context.fillRect(8, 8, 16, 16);
	context.fillStyle = 'magenta';
	context.fillRect(8, 0, 16, 8);
	context.fillRect(0, 8, 8, 16);

	return new PIXI.Texture(new PIXI.BaseTexture(new PIXI.resources.CanvasResource(canvas)));
}

type SOLID_COLOR_OPTIONS = "black" | "white" | "empty" | "missing";

function solidColorSprite(color: SOLID_COLOR_OPTIONS): PIXI.Sprite;
function solidColorSprite(color: SOLID_COLOR_OPTIONS, sprite: PIXI.Sprite): PIXI.Sprite;
function solidColorSprite(color: SOLID_COLOR_OPTIONS, width: number, height: number): PIXI.Sprite;

function solidColorSprite(color: SOLID_COLOR_OPTIONS,
		arg2?: PIXI.Sprite | number, arg3?: number): PIXI.Sprite {
	let tex: PIXI.Texture =
		color === "black" ? TextureUtil.BLACK :
		color === "white" ? PIXI.Texture.WHITE :
		color === "empty" ? PIXI.Texture.EMPTY :
		TextureUtil.MISSING;
	let newSprite = new PIXI.Sprite(tex);
	if (arg2) {
		if (typeof arg2 === "number") {
			newSprite.width = arg2;
			newSprite.height = arg3 ?? 16;
		} else {
			newSprite.width = arg2.width;
			newSprite.height = arg2.height;
		}
	} else {
		newSprite.width = 16;
		newSprite.height = 16;
	}
	return newSprite;
}

function maskSprite(texture: PIXI.Texture, color: string | number) {
	if (typeof color === "string") {
		if (color === "white") {
			color = 0xFFFFFF;
		} else {
			color = 0x000000;
		}
	}
	let sprite = new PIXI.Sprite(texture);
	sprite.tint = 0;
	(<any>sprite)._addRGB = color;
	return sprite;
}

export const TextureUtil = {
	BLACK: createBlackTexture(),
	MISSING: createMissingTexture(),
	/**
	 * Creates a new sprite of a solid color (or checkerboard in the case of `missing`).
	 * If given a sprite, copies the width/height of it.
	 * If given two numbers, uses them as the width and height.
	 * Otherwise, defaults to 16x16.
	 */
	solidColorSprite,
	maskSprite
}