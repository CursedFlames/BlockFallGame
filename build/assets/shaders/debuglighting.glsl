#version 300 es
precision highp float;
#define GLSLIFY 1

in vec2 vTextureCoord;

uniform sampler2D uSampler; // lit
uniform sampler2D uSampler2; // unlit

uniform float brightness;

layout(location = 0) out vec4 color_0;

void main() {
	vec4 lit = texture(uSampler, vTextureCoord);
	vec4 unlit = texture(uSampler2, vTextureCoord);
	color_0 = mix(unlit, lit, brightness);
}