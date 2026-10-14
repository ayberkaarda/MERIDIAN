// 01 ORBITAL PROPULSION: a directional plasma field. Anisotropic noise is
// stretched along the thrust axis and advected downstream; the plume widens
// and cools with distance from the throat on the left edge.

void main() {
  vec2 p = panelPoint();
  float halfWidth = 0.5 * uAspect;
  // 0 at the throat, 1 at the far edge.
  float downstream = clamp((p.x + halfWidth) / (2.0 * halfWidth), 0.0, 1.0);

  float spread = mix(0.035, 0.3, pow(downstream, 0.8));
  float bend = 0.035 * sin(downstream * 3.1 + 0.6);
  float y = (p.y - bend) / spread;
  float envelope = exp(-y * y * 1.4);

  vec3 q = vec3(p.x * 1.6 - uTime * 0.32, y * 1.15, uTime * 0.045);
  float filaments = fbm(vec3(q.x * 0.9, q.y * 3.2, q.z), TECH_OCTAVES);
  float body = fbm(q * 0.7 + vec3(4.1, 0.0, 1.7), TECH_OCTAVES);

  // Fine streak lines that follow the flow direction.
  float streak = pow(abs(sin((y + (filaments - 0.5) * 1.6) * 9.0)), 18.0) * envelope;

  float heat = envelope * mix(1.0, 0.18, downstream);
  float density = heat * (0.55 + 0.9 * (body - 0.4)) + streak * 0.22 * (1.0 - downstream * 0.6);
  density = clamp(density, 0.0, 1.0);

  // Throat: a tight hot core at the nozzle.
  vec2 throatOffset = p - vec2(-halfWidth, bend);
  float throat = exp(-dot(throatOffset, throatOffset) * 90.0);

  vec3 color = mix(PANEL_BG, PANEL_MUTED * 0.55, smoothstep(0.0, 0.35, density));
  color = mix(color, PANEL_INK, smoothstep(0.35, 1.0, density) * 0.85);
  color += PANEL_INK * throat * 0.6;
  finishPanel(color);
}
