#version 300 es
precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uSampler;

const float threshold = 1.0;

layout(location = 0) out vec4 color_0;

// TODO this can be merged with the previous step by rendering to both lighting output
// and bloom input

void main() {
	vec4 color = texture(uSampler, vTextureCoord);
	// TODO do we want to use brightness instead? (max(r,g,b))
	float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
	float contribution = max(0.0, luminance - threshold);
	contribution /= max(luminance, 0.00001);
	color_0 = vec4(color.rgb*color.a*contribution, 1.0);
}