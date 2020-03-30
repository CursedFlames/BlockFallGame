#version 300 es
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSampler2;
layout(location = 0) out vec4 color_0;
layout(location = 1) out vec4 color_1;
layout(location = 2) out vec4 color_2;

const float gamma = 2.2;
#pragma glslify: gammaToLinear = require('../util/gamma/in', gamma=gamma)
void main() {
	color_0 = texture(uSampler, vTextureCoord);
	color_0 = gammaToLinear(color_0);
	color_0 *= vec4(texture(uSampler2, vTextureCoord).rgb*8.0 + vec3(1.0), 1.0);
	color_1 = vec4(0.);
	color_2 = vec4(0.);
}