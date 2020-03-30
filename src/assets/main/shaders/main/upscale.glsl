varying vec2 vTextureCoord;
uniform sampler2D uSampler;
// uniform highp vec4 inputSize;
uniform vec4 inputPixel;
// uniform highp vec4 outputFrame;
uniform vec4 scaleFactor;
uniform vec4 inputClamp;

uniform bool smoothX;
uniform bool smoothY;

// a is top left, b top right, c bottom left, d bottom right
// xLerp is lerp along x axis, same for yLerp
vec4 biLerp(vec4 a, vec4 b, vec4 c, vec4 d, float xLerp, float yLerp) {
	vec4 e = mix(a, b, xLerp);
	vec4 f = mix(c, d, xLerp);
	return mix(e, f, yLerp);
}

// #pragma glslify: biLerp = require('../util/bilerp')

void main() {
	// current position, normalized to [0, 1)
	// or maybe [0, 1], I'm not sure.
	// vec2 normalizedPos = vTextureCoord*inputSize.xy/outputFrame.zw;

	vec2 pixel = vTextureCoord*inputPixel.xy*scaleFactor.zw;

	// this is magic, see https://www.shadertoy.com/view/MlB3D3
	vec2 a = floor(pixel) + 0.5;
	vec2 b = a + vec2(smoothX ? 1.0 : 0.0, 0.0);
	vec2 c = a + vec2(0.0, smoothY ? 1.0 : 0.0);
	vec2 d = a + vec2(smoothX ? 1.0 : 0.0, smoothY ? 1.0 : 0.0);
	a *= inputPixel.zw;
	b = min(b*inputPixel.zw, inputClamp.zw);
	c = min(c*inputPixel.zw, inputClamp.zw);
	d = min(d*inputPixel.zw, inputClamp.zw);

	vec4 ta = texture2D(uSampler, a);
	vec4 tb = texture2D(uSampler, b);
	vec4 tc = texture2D(uSampler, c);
	vec4 td = texture2D(uSampler, d);

	// gl_FragColor = texture2D(uSampler, a);
	vec2 lerp = 1.0 - clamp((1.0 - fract(pixel)) * scaleFactor.xy, 0.0, 1.0);
	gl_FragColor = biLerp(ta, tb, tc, td, lerp.x, lerp.y);
	// gl_FragColor = mix(ta, tc, lerp.y);
}