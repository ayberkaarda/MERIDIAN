// 04 LIFE SUPPORT: a pressurised volume. A spherical vessel is ray-marched
// through an internal density field (the atmosphere it holds) and wrapped in
// a thin membrane with two weld seams. The vessel breathes very slightly.
// Requires the VOLUME_STEPS define (at most MAX_STEPS).

const int MAX_STEPS = 12;

void main() {
  vec2 p = panelPoint();
  float breathe = 1.0 + 0.012 * sin(uTime * 0.55);
  float radius = 0.31 * breathe;
  float r = length(p);
  float pixel = length(fwidth(p));
  vec3 color = PANEL_BG;

  if (r < radius) {
    // Orthographic ray through the sphere: depth extent from the silhouette.
    float depth = sqrt(max(radius * radius - r * r, 0.0));
    vec3 lightDirection = normalize(vec3(0.6, 0.55, 0.6));
    float stepLength = 2.0 * depth / float(VOLUME_STEPS);
    float transmittance = 1.0;
    vec3 scattered = vec3(0.0);
    for (int i = 0; i < MAX_STEPS; i++) {
      if (i >= VOLUME_STEPS) break;
      float z = -depth + (float(i) + 0.5) * stepLength;
      vec3 point = vec3(p, z) / radius;
      float shell = 1.0 - smoothstep(0.55, 1.0, length(point));
      float density = fbm(point * 1.8 + vec3(0.0, uTime * 0.03, uTime * 0.015), TECH_OCTAVES);
      density = smoothstep(0.42, 0.78, density) * (0.4 + 0.6 * shell);
      // Light arrives from the upper right; the far side of the gas falls into shade.
      float lit = 0.35 + 0.65 * clamp(dot(normalize(point + 1e-4), lightDirection) * 0.5 + 0.5, 0.0, 1.0);
      float absorb = density * stepLength * 9.0;
      scattered += transmittance * absorb * lit * PANEL_INK * 0.55;
      transmittance *= exp(-absorb);
    }
    color = PANEL_BG * transmittance + scattered;

    // Membrane: a fresnel-thin edge, brightest toward the light.
    vec3 normal = vec3(p, depth) / radius;
    float fresnel = pow(1.0 - normal.z, 4.0);
    float facing = clamp(dot(normal, lightDirection), 0.0, 1.0);
    color += PANEL_MUTED * fresnel * (0.25 + 0.75 * facing);

    // Weld seams: the equator and one tilted meridian, on the front hemisphere.
    float equator = 1.0 - smoothstep(0.0, pixel * 1.2, abs(normal.y * radius));
    float meridian = 1.0 - smoothstep(0.0, pixel * 1.2, abs(normal.x * cos(0.5) - normal.z * sin(0.5)) * radius);
    color = mix(color, PANEL_MUTED, max(equator, meridian) * 0.35);
  }

  // Silhouette hairline, anti-aliased on both sides.
  float outline = 1.0 - smoothstep(0.0, pixel * 1.2, abs(r - radius));
  color = mix(color, PANEL_INK, outline * 0.45);

  finishPanel(color);
}
