import { DisplayObjectWrapper, SpriteWrapper } from "../render/spriteWrapper";
import { KeyboardState } from "src/main/util/keyboard";
import { TextureUtil } from "src/main/util/texture";
import * as PIXI from "pixi.js";
import { BOX_TYPE } from "src/main/constants";

export interface Entity {
	size?: PIXI.Point;
	display?: DisplayObjectWrapper<PIXI.DisplayObject>;
	position: PIXI.Point;
	onTick?: (keyboardState: KeyboardState)=>void;
}

export class Box {
	display: SpriteWrapper;
	constructor(public size: PIXI.Point, public vx: number, public vy: number, public position: PIXI.Point,
			public type: BOX_TYPE) {
		let main = TextureUtil.solidColorSprite("white", size.x, size.y);
		let color: number;
		let brightness: number;
		let brightnessMultiVal: number;
		if (type === BOX_TYPE.HEAL) {
			color =
				((Math.floor(Math.random()*0x10)) << 16)
				+ ((Math.floor(Math.random()*0x20)+0xDF) << 8)
				+ ((Math.floor(Math.random()*0x30)) << 16);
			brightness = Math.floor(Math.random() * 0x8) + 0x38;
			brightnessMultiVal = brightness << 8;
		} else {
			color =
				((Math.floor(Math.random()*0x20)+0xDF) << 16)
				+ ((Math.floor(Math.random()*0x20)) << 8)
				+ 0;
			brightness = Math.floor(Math.random() * 0x20) + 0xA0;
			brightnessMultiVal = brightness << 16;
		}
		main.tint = color;
		let brightnessMulti = TextureUtil.solidColorSprite("white", size.x, size.y);
		
		brightnessMulti.tint = brightnessMultiVal;
		this.display = new SpriteWrapper({
			main: main,
			unlit: TextureUtil.solidColorSprite("black", size.x, size.y),
			brightnessMulti: brightnessMulti,
			lightFalloff: PIXI.Texture.EMPTY
		});
		this.display.position = this.position;
		if (type === BOX_TYPE.HEAL) {
			// make it larger so it's easier to pick up
			this.size.x += 8;
			this.size.y += 8;
		}
	}

	onTick(keyboardState: KeyboardState) {
		this.position.x -= this.vx;
		this.position.y += this.vy;
		if (this.type === BOX_TYPE.HEAL) {
			this.display.position.set(this.position.x+4, this.position.y+4);
		} else {
			this.display.position = this.position;
		}
	}

	destroy() {
		this.size = null!;
		this.position = null!
		this.display.destroy();
		this.display = null!;
	}
}