
vec4 texture2D(sampler2D image, vec2 uv) {
	return texture(image, uv);
}
#pragma glslify: export(texture2D)