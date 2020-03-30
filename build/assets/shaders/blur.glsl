#version 300 es
precision highp float;
#define GLSLIFY 1

vec4 texture2D(sampler2D image_0, vec2 uv_0) {
	return texture(image_0, uv_0);
}

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}

in vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 direction;

layout(location = 0) out vec4 color_0;

const vec2 res = vec2(320., 180.);

void main() {
	vec2 uv = vec2(vTextureCoord.xy);
	color_0 = blur13(uSampler, uv, res, direction);
}