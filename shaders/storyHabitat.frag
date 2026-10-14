// 02 THE HABITAT: a volume and its light. A long pressurised module (a
// capsule: cylinder with hemispherical ends) floats in a pale field. It is
// shaded as a matte solid under one slowly travelling sun, with module seams
// on its hull, a docking collar at one end and a soft occlusion shadow
// falling onto the paper below. The light angle drifts by a few degrees only.

void main() {
  vec2 p = storyPoint();
  float pixel = length(fwidth(p)) * 0.7071;

  // Module axis: a horizontal segment, slightly raised above centre.
  float halfLength = min(0.36 * uAspect, 0.62);
  vec2 axisStart = vec2(-halfLength + 0.04 * uAspect, 0.04);
  vec2 axisEnd = vec2(halfLength + 0.04 * uAspect, 0.04);
  float radius = 0.13;

  vec2 axis = axisEnd - axisStart;
  float along = clamp(dot(p - axisStart, axis) / dot(axis, axis), 0.0, 1.0);
  vec2 closest = axisStart + axis * along;
  vec2 offset = p - closest;
  float dist = length(offset) - radius;

  // Field: a gentle vertical light gradient with a faint volumetric haze.
  float haze = fbm(vec3(p * 1.6 + vec2(uTime * 0.006, 0.0), 0.4), STORY_OCTAVES) - 0.5;
  vec3 color = paper(0.04 + 0.16 * smoothstep(0.5, -0.5, p.y) + 0.035 * haze);

  // Contact shadow on the paper below the hull: a wide soft falloff.
  vec2 shadowOffset = p - (closest + vec2(0.03, -0.17));
  float shadow = exp(-dot(shadowOffset * vec2(0.9, 3.4), shadowOffset * vec2(0.9, 3.4)) * 26.0);
  color = mix(color, paper(0.62), shadow * 0.35 * smoothstep(-0.02, 0.06, dist));

  // Light: a sun high and to the left, swinging by about five degrees.
  float sweep = 0.09 * sin(uTime * 0.045);
  vec3 lightDirection = normalize(vec3(-0.55 + sweep, 0.62, 0.56));

  if (dist < 0.0) {
    vec2 local = offset / radius;
    vec3 normal = vec3(local, sqrt(max(1.0 - dot(local, local), 0.0)));
    float diffuse = clamp(dot(normal, lightDirection) * 0.8 + 0.2, 0.0, 1.0);
    // Wrapped falloff keeps the shadow side open, like light bounced off paper.
    float wrap = smoothstep(0.0, 1.0, diffuse);
    float rim = pow(1.0 - normal.z, 3.0);
    vec3 lit = paper(0.08 + 0.1 * rim);
    vec3 shade = paper(0.72);
    color = mix(shade, lit, wrap);

    // Seams between modules, wrapping around the cylinder; foreshortened at
    // the silhouette by the normal so they read as rings, not stripes.
    float segment = (p.x - axisStart.x) / 0.19;
    float seamField = (fract(segment) - 0.5) * 0.19;
    float onCylinder = step(0.0005, along) * step(along, 0.9995);
    float seam = hairline(abs(seamField) - 0.095, pixel, 1.0) * onCylinder;
    color = mix(color, STORY_INK, seam * 0.35 * (0.4 + 0.6 * normal.z));

    // A pale band of windows along the lit flank of the middle module.
    float band = hairline(local.y - 0.38, pixel / radius, 2.4);
    float span = step(-0.12 * uAspect, p.x) * step(p.x, 0.16 * uAspect);
    color = mix(color, STORY_BG, band * span * 0.45 * wrap);
  }

  // Silhouette hairline and the docking collar at the right end.
  color = mix(color, STORY_INK, hairline(dist, pixel, 0.9) * 0.5);
  vec2 collar = p - (axisEnd + vec2(radius * 0.72, 0.0));
  float collarRing = length(vec2(collar.x / 0.28, collar.y)) - radius * 0.62;
  // The ring is seen almost edge-on; its far half is hidden by the hull.
  float collarFront = step(0.0, collar.x);
  color = mix(color, STORY_INK, hairline(collarRing, fwidth(collarRing), 1.0) * 0.45 * collarFront);

  finishStory(color);
}
