#version 300 es
precision highp float;
#define GLSLIFY 1
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSampler2;
layout(location = 0) out vec4 color_0;
layout(location = 1) out vec4 color_1;
layout(location = 2) out vec4 color_2;

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
	color_1 = texture(uSampler, vTextureCoord);
	color_1 = gammaToLinear(color_1);
	color_1 *= vec4(texture(uSampler2, vTextureCoord).rgb*8.0 + vec3(1.0), 1.0);
	color_0 = vec4(0.);
	color_2 = vec4(0.);
}