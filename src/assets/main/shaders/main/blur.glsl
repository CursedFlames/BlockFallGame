#version 300 es
precision highp float;

#pragma glslify: texture2D = require('../util/es3shim')
#pragma glslify: blur = require('glsl-fast-gaussian-blur/13')

in vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 direction;

layout(location = 0) out vec4 color_0;

const vec2 res = vec2(320., 180.);

void main() {
	vec2 uv = vec2(vTextureCoord.xy);
	color_0 = blur(uSampler, uv, res, direction);
}