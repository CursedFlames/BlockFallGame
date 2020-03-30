#version 300 es
precision highp float;
#define GLSLIFY 1

in vec2 vTextureCoord;

uniform vec4 inputPixel;
uniform sampler2D uSampler;

layout(location = 0) out vec4 color_0;

void main() {
	color_0 = texture(uSampler, vTextureCoord);
}