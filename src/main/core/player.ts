import { KeyboardState } from "src/main/util/keyboard";
import { Entity } from "./entity";
import { TextureUtil } from "src/main/util/texture";
import { SpriteWrapper } from "../render/spriteWrapper";
import * as PIXI from "pixi.js";


const MIN_X = 32;
const MAX_X = 72;
const MIN_Y = 0;
const MAX_Y = 172;
const MOVE_SPEED = 2;
export class Player implements Entity {
	readonly size = new PIXI.Point(8, 8);
	display = new SpriteWrapper({
		main: TextureUtil.solidColorSprite("white", 8, 8),
		unlit: TextureUtil.solidColorSprite("black", 8, 8),
		brightnessMulti: TextureUtil.solidColorSprite("white", 8, 8),
		lightFalloff: PIXI.Texture.EMPTY
	});
	position: PIXI.Point = new PIXI.Point(56, 86);

	constructor() {
		this.display.layers.main.tint = 0x33FFFF;
		this.display.layers.brightnessMulti.tint = 0x101010;
		this.display.position = this.position;
	}

	onTick(keyboardState: KeyboardState) {
		if (keyboardState.pressed.ArrowLeft || keyboardState.pressed.KeyA) {
			this.position.x -= MOVE_SPEED;
		}
		if (keyboardState.pressed.ArrowRight || keyboardState.pressed.KeyD) {
			this.position.x += MOVE_SPEED;
		}
		if (keyboardState.pressed.ArrowUp || keyboardState.pressed.KeyW) {
			this.position.y -= MOVE_SPEED;
		}
		if (keyboardState.pressed.ArrowDown || keyboardState.pressed.KeyS) {
			this.position.y += MOVE_SPEED;
		}

		if (this.position.x < MIN_X) this.position.x = MIN_X;
		if (this.position.x > MAX_X) this.position.x = MAX_X;
		if (this.position.y < MIN_Y) this.position.y = MIN_Y;
		if (this.position.y > MAX_Y) this.position.y = MAX_Y;

		this.display.position = this.position;
	}
}