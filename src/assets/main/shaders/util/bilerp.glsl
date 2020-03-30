

vec4 biLerp(vec4 x0y0, vec4 x1y0, vec4 x0y1, vec4 x1y1, vec2 lerp) {
	vec4 y0 = mix(x0y0, x1y0, lerp.x);
	vec4 y1 = mix(x0y1, x1y1, lerp.x);
	return mix(y0, y1, lerp.y);
}

vec3 biLerp(vec3 x0y0, vec3 x1y0, vec3 x0y1, vec3 x1y1, vec2 lerp) {
	vec3 y0 = mix(x0y0, x1y0, lerp.x);
	vec3 y1 = mix(x0y1, x1y1, lerp.x);
	return mix(y0, y1, lerp.y);
}

vec2 biLerp(vec2 x0y0, vec2 x1y0, vec2 x0y1, vec2 x1y1, vec2 lerp) {
	vec2 y0 = mix(x0y0, x1y0, lerp.x);
	vec2 y1 = mix(x0y1, x1y1, lerp.x);
	return mix(y0, y1, lerp.y);
}

#pragma glslify: export(biLerp)