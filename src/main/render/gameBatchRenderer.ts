import * as PIXI from "pixi.js";

const shaderVert = `
precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;
attribute vec4 aColor2;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying vec3 vColorAdd;
varying float vTextureId;

void main(void){
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    
    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
	vColor = aColor * tint;
	vColorAdd = aColor2.rgb;
}`;

const shaderFrag = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying vec3 vColorAdd;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
	vec4 color;
	%forloop%
	gl_FragColor = color * vColor;
	gl_FragColor += vec4(vColorAdd.rgb * gl_FragColor.a, 0);
}`;


export class GameBatchGeometry extends PIXI.Geometry {
	_buffer: PIXI.Buffer;
	_indexBuffer : PIXI.Buffer;

	constructor(_static = false) {
		super();

		this._buffer = new PIXI.Buffer(null!, _static, false);

		this._indexBuffer = new PIXI.Buffer(null!, _static, true);

		this.addAttribute('aVertexPosition', this._buffer, 2, false, PIXI.TYPES.FLOAT)
			.addAttribute('aTextureCoord', this._buffer, 2, false, PIXI.TYPES.FLOAT)
			// this one counts as 1 instead of 4 because byte instead of float
			// ... I think
			.addAttribute('aColor', this._buffer, 4, true, PIXI.TYPES.UNSIGNED_BYTE)
			.addAttribute('aTextureId', this._buffer, 1, true, PIXI.TYPES.FLOAT)
			// ditto for this
			.addAttribute('aColor2', this._buffer, 4, true, PIXI.TYPES.UNSIGNED_BYTE)
			.addIndex(this._indexBuffer);
	}
}

export class GameBatchPluginFactory {
	static create(options: any): typeof PIXI.AbstractBatchRenderer {
		const { vertex, fragment, vertexSize, geometryClass } = (Object as any).assign({
			vertex: shaderVert,
			fragment: shaderFrag,
			geometryClass: GameBatchGeometry,
			vertexSize: 7
		}, options);
		return class BatchPlugin extends PIXI.AbstractBatchRenderer {
			constructor(renderer: PIXI.Renderer) {
				super(renderer);

				this.shaderGenerator = new PIXI.BatchShaderGenerator(vertex, fragment);
				this.geometryClass = geometryClass;
				this.vertexSize = vertexSize;
			}
			vertexSize: number;

			packInterleavedGeometry(element: any, attributeBuffer: PIXI.ViewableBuffer,
					indexBuffer: Uint16Array, aIndex: number, iIndex: number): void {
				const {
					uint32View,
					float32View,
				} = attributeBuffer;

				const packedVertices = aIndex / this.vertexSize;
				const uvs = element.uvs;
				const indices = element.indices;
				const vertexData = element.vertexData;
				const textureId = element._texture.baseTexture._batchLocation;

				const alpha = Math.min(element.worldAlpha, 1.0);
				const argb = (alpha < 1.0
					&& element._texture.baseTexture.alphaMode)
					? PIXI.utils.premultiplyTint(element._tintRGB, alpha)
					: element._tintRGB + (alpha * 255 << 24);
				// for some reason pixi/webgl uses BGR instead of RGB, so we swap B and R
				let rgb2 = element._addRGB
					? ((element._addRGB & 0xFF0000) >> 16)
						+ ((element._addRGB & 0x0000FF) << 16)
						+ (element._addRGB & 0x00FF00)
					: 0;
				// const argb2 = (alpha < 1.0
				// 	&& element._texture.baseTexture.alphaMode)
				// 	? PIXI.utils.premultiplyTint(rgb2, alpha)
				// 	: rgb2 + (alpha * 255 << 24);
				
				for (let i = 0; i < vertexData.length; i += 2) {
					float32View[aIndex++] = vertexData[i];
					float32View[aIndex++] = vertexData[i + 1];
					float32View[aIndex++] = uvs[i];
					float32View[aIndex++] = uvs[i + 1];
					uint32View[aIndex++] = argb;
					float32View[aIndex++] = textureId;
					uint32View[aIndex++] = rgb2;
				}

				for (let i = 0; i < indices.length; i++) {
					indexBuffer[iIndex++] = packedVertices + indices[i];
				}
			}
		}
	}
}