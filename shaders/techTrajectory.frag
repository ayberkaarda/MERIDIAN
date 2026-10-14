// 03 AUTONOMOUS NAVIGATION: a trajectory line field. Streamlines of a uniform
// flow past two point sources, so every line is a path deflected by the
// bodies. A slow dash travels along the lines on the velocity potential,
// which is orthogonal to them.

const float TAU = 6.28318530718;
const float LINES = 20.0;

void main() {
  vec2 p = panelPoint();
  float drift = uTime * 0.04;

  vec2 m1 = vec2(-0.12 * uAspect, 0.06 + 0.01 * sin(drift));
  vec2 m2 = vec2(0.2 * uAspect, -0.11 + 0.01 * cos(drift * 1.3));
  float s1 = 1.0;
  // s1 * LINES and s2 * LINES are integers, so the atan branch cut vanishes in fract().
  float s2 = 0.6;
  float flow = 1.15;

  vec2 d1 = p - m1;
  vec2 d2 = p - m2;
  float r1 = max(dot(d1, d1), 1e-5);
  float r2 = max(dot(d2, d2), 1e-5);

  float psi = (s1 * atan(d1.y, d1.x) + s2 * atan(d2.y, d2.x)) / TAU + flow * p.y;
  float phi = (s1 * 0.5 * log(r1) + s2 * 0.5 * log(r2)) / TAU + flow * p.x;

  // Analytic gradient of psi: screen derivatives of atan blow up on the branch
  // cut, the closed form does not.
  vec2 gradient = (s1 * vec2(-d1.y, d1.x) / r1 + s2 * vec2(-d2.y, d2.x) / r2) / TAU + vec2(0.0, flow);
  float pixel = length(fwidth(p)) * 0.7071;
  float line = isoLine(psi * LINES, length(gradient) * LINES * pixel, 0.9);

  float travel = fract(phi * 6.0 - uTime * 0.12);
  float dash = smoothstep(0.0, 0.25, travel) * (1.0 - smoothstep(0.55, 0.85, travel));

  // Lines fade into the near field so the masses read as clear voids.
  float clearance = smoothstep(0.0012, 0.006, min(r1, r2));
  vec3 color = PANEL_BG + PANEL_MUTED * line * 0.4 * clearance;
  color = mix(color, PANEL_INK, line * dash * 0.4 * clearance);

  // The masses: small solid discs with one hairline orbit each.
  float aa = pixel * 1.5;
  float distance1 = sqrt(r1);
  float distance2 = sqrt(r2);
  float body1 = 1.0 - smoothstep(0.012 - aa, 0.012, distance1);
  float body2 = 1.0 - smoothstep(0.008 - aa, 0.008, distance2);
  float orbit1 = 1.0 - smoothstep(0.0, aa, abs(distance1 - 0.05));
  float orbit2 = 1.0 - smoothstep(0.0, aa, abs(distance2 - 0.036));
  color = mix(color, PANEL_INK, max(body1, body2));
  color = mix(color, PANEL_MUTED, max(orbit1, orbit2) * 0.7);

  finishPanel(color);
}
