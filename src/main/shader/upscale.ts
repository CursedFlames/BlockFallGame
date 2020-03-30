import * as PIXI from "pixi.js";

export class Upscaler {
	filter: PIXI.Filter;
	constructor(shaderString: string, scaleX: number, scaleY: number,
			smoothX: boolean = false, smoothY: boolean = true) {
		this.filter = new PIXI.Filter(undefined, shaderString);
		this.resize(scaleX, scaleY);
		this.setSmoothing(smoothX, smoothY);
	}

	resize(scaleX: number, scaleY: number) {
		this.filter.uniforms.scaleFactor = new Float32Array([scaleX, scaleY, 1/scaleX, 1/scaleY]);
	}

	setSmoothing(smoothX: boolean, smoothY: boolean) {
		this.filter.uniforms.smoothX = smoothX;
		this.filter.uniforms.smoothY = smoothY;
	}
}