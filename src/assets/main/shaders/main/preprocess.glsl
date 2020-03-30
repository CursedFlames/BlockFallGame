varying vec2 vTextureCoord;
uniform sampler2D uSampler;

const float gamma = 2.2;
#pragma glslify: gammaToLinear = require('../util/gamma/in', gamma=gamma)
void main() {
	gl_FragColor = texture2D(uSampler, vTextureCoord);
	gl_FragColor = gammaToLinear(gl_FragColor);
}