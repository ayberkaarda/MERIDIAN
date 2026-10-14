// Shared header for the three story panels. Prepended after noise.glsl.
// The panels sit on the light theme: paper-toned fields with ink hairlines.
// All colour math is linear; the output goes through <colorspace_fragment>.

uniform float uTime;
uniform float uAspect;
uniform float uGrain;

varying vec2 vUv;

// Palette, linear: --bg-light, --ink-dark, --muted.
const vec3 STORY_BG = vec3(0.905, 0.879, 0.823);
const vec3 STORY_INK = vec3(0.00304);
const vec3 STORY_MUTED = vec3(0.266);

float storyHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

// Panel coordinates: height spans -0.5..0.5, width scales with the aspect.
vec2 storyPoint() {
  return vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
}

// Paper tone between the background and the muted grey, 0 = background.
vec3 paper(float shade) {
  return mix(STORY_BG, STORY_MUTED, clamp(shade, 0.0, 1.0));
}

// Anti-aliased hairline around `dist` = 0, `pixel` its change per pixel.
float hairline(float dist, float pixel, float width) {
  float px = max(pixel, 1e-5);
  return 1.0 - smoothstep(px * width * 0.5, px * (width * 0.5 + 1.0), abs(dist));
}

// Writes the final opaque colour with grain applied.
void finishStory(vec3 color) {
  // Grain re-seeds 24 times a second while time runs and holds still otherwise.
  float grain = storyHash(gl_FragCoord.xy + floor(uTime * 24.0) * 17.0) - 0.5;
  color = max(color + grain * uGrain, 0.0);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
