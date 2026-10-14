// Shared header for the four technology panels. Prepended after noise.glsl.
// All colour math is linear; the output goes through <colorspace_fragment>.

uniform float uTime;
uniform float uAspect;
// 0..1 crossfade into this visual. Only reduced motion animates it; otherwise
// the DOM shutter carries the swap and this stays at 1.
uniform float uReveal;
uniform float uGrain;

varying vec2 vUv;

// Palette, linear: --bg-dark, --ink-light, --muted.
const vec3 PANEL_BG = vec3(0.0009);
const vec3 PANEL_INK = vec3(0.905, 0.879, 0.823);
const vec3 PANEL_MUTED = vec3(0.266);

float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

// Panel coordinates: height spans -0.5..0.5, width scales with the aspect.
vec2 panelPoint() {
  return vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
}

// Anti-aliased iso-line of a scalar field. `pixelGradient` is the field's change
// per pixel, `width` the line weight in pixels.
float isoLine(float field, float pixelGradient, float width) {
  float distanceToLine = abs(fract(field + 0.5) - 0.5);
  float pixel = max(pixelGradient, 1e-5);
  return 1.0 - smoothstep(pixel * width * 0.5, pixel * (width * 0.5 + 1.0), distanceToLine);
}

// Writes the final colour with grain and the swap transition applied.
void finishPanel(vec3 color) {
  float alpha = clamp(uReveal, 0.0, 1.0);
  if (alpha <= 0.0) discard;
  // Grain re-seeds 24 times a second while time runs and holds still otherwise.
  float grain = hash12(gl_FragCoord.xy + floor(uTime * 24.0) * 17.0) - 0.5;
  color = max(color + grain * uGrain, 0.0);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
