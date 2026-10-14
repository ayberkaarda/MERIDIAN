// 02 THERMAL SYSTEMS: a thermal gradient map. A smooth temperature field from
// a few heat sources over a radiator plate, shown as a restrained ramp with
// thin isotherms.

vec3 thermalRamp(float t) {
  // Graphite -> slate -> warm grey -> bone. No hue beyond a trace of warmth.
  vec3 graphite = vec3(0.004, 0.0042, 0.0046);
  vec3 slate = vec3(0.034, 0.036, 0.04);
  vec3 warm = vec3(0.21, 0.18, 0.15);
  vec3 c = mix(graphite, slate, smoothstep(0.0, 0.35, t));
  c = mix(c, warm, smoothstep(0.35, 0.75, t));
  return mix(c, PANEL_INK, smoothstep(0.75, 1.0, t));
}

void main() {
  vec2 p = panelPoint();
  float drift = uTime * 0.05;

  vec2 a = vec2(-0.18 * uAspect, 0.12) + 0.03 * vec2(sin(drift * 1.3), cos(drift));
  vec2 b = vec2(0.22 * uAspect, -0.16) + 0.03 * vec2(cos(drift * 0.8), sin(drift * 1.1));
  vec2 c = vec2(0.05 * uAspect, 0.3);

  float field = 0.62 * exp(-dot(p - a, p - a) * 9.0)
    + 0.48 * exp(-dot(p - b, p - b) * 12.0)
    + 0.22 * exp(-dot(p - c, p - c) * 24.0);
  // Conduction noise keeps the isotherms from looking drawn with a compass.
  field += 0.16 * (fbm(vec3(p * 2.4, drift * 0.6), TECH_OCTAVES) - 0.5);
  field = clamp(field, 0.0, 1.0);

  vec3 color = thermalRamp(field);

  float levels = field * 14.0;
  float isotherm = isoLine(levels, fwidth(levels), 1.0);
  color = mix(color, PANEL_INK, isotherm * 0.18 * smoothstep(0.08, 0.3, field));

  finishPanel(color);
}
