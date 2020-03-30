varying vec2 vTextureCoord;
uniform sampler2D uSampler;

const float gamma = 2.2;
#pragma glslify: linearToGamma = require('../util/gamma/out', gamma=gamma)
void main() {
	gl_FragColor = texture2D(uSampler, vTextureCoord);
	
	gl_FragColor = linearToGamma(gl_FragColor);
}