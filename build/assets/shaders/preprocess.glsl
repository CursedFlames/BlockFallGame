#define GLSLIFY 1
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

const float gamma = 2.2;
float gammaToLinear(float val) {
	return pow(val, gamma);
}

vec2 gammaToLinear(vec2 val) {
	return pow(val, vec2(gamma));
}

vec3 gammaToLinear(vec3 val) {
	return pow(val, vec3(gamma));
}

vec4 gammaToLinear(vec4 val) {
	return vec4(gammaToLinear(val.rgb), val.a);
}

void main() {
	gl_FragColor = texture2D(uSampler, vTextureCoord);
	gl_FragColor = gammaToLinear(gl_FragColor);
}