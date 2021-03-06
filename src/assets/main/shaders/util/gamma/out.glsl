float linearToGamma(float val) {
	return pow(val, 1.0 / gamma);
}

vec2 linearToGamma(vec2 val) {
	return pow(val, vec2(1.0 / gamma));
}

vec3 linearToGamma(vec3 val) {
	return pow(val, vec3(1.0 / gamma));
}

vec4 linearToGamma(vec4 val) {
	return vec4(linearToGamma(val.rgb), val.a);
}

#pragma glslify: export(linearToGamma)