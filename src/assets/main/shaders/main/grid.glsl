#version 300 es
precision highp float;

in vec2 vTextureCoord;

uniform vec4 inputPixel;
uniform sampler2D uSampler;

layout(location = 0) out vec4 color_0;

void main() {
	vec4 color = texture(uSampler, vTextureCoord);
	vec2 pos = vTextureCoord * inputPixel.xy;
	if (mod(pos.x, 8.0) > 7.0 || mod(pos.y, 8.0) > 7.0) {
		color = vec4(0.0, 0.0, 1.0, 1.0);
	}
	color_0 = color;
}