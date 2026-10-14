// 01 THE ORBIT: an orbital gradient field. A primary body sits low and off
// frame left; its potential well shades the paper in a soft radial gradient.
// Three inclined orbits are drawn as hairlines that pass behind the body, and
// one small satellite travels the middle orbit very slowly.

const float INCLINATION = 0.38;
const float TILT = 0.21;

// Panel point to the orbital plane: rotated by the tilt and de-projected by
// the inclination, so orbits become circles of radius r around the body.
vec2 toPlane(vec2 p, vec2 center) {
  vec2 d = p - center;
  float c = cos(TILT);
  float s = sin(TILT);
  vec2 q = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  return vec2(q.x, q.y / INCLINATION);
}

vec2 fromPlane(vec2 q, vec2 center) {
  vec2 r = vec2(q.x, q.y * INCLINATION);
  float c = cos(TILT);
  float s = sin(TILT);
  return center + vec2(c * r.x - s * r.y, s * r.x + c * r.y);
}

void main() {
  vec2 p = storyPoint();
  vec2 center = vec2(-0.28 * uAspect, -0.16);
  float bodyRadius = 0.15;
  float pixel = length(fwidth(p)) * 0.7071;

  // Potential well: darkest near the body, fading toward the far corner.
  float well = 1.0 / (1.0 + 5.5 * length(p - center));
  float haze = fbm(vec3(p * 2.2, uTime * 0.012), STORY_OCTAVES) - 0.5;
  vec3 color = paper(0.06 + 0.32 * well * well + 0.03 * haze);

  vec2 q = toPlane(p, center);
  float planeRadius = length(q);
  float planePixel = length(fwidth(q)) * 0.7071;
  float bodyDistance = length(p - center);
  bool insideBody = bodyDistance < bodyRadius;

  // Orbits behind the body (far half of the plane, q.y > 0) are hidden by it.
  float occluded = insideBody && q.y > 0.0 ? 0.0 : 1.0;
  float radii[3];
  radii[0] = 0.27;
  radii[1] = 0.46;
  radii[2] = 0.78;
  for (int i = 0; i < 3; i++) {
    float line = hairline(planeRadius - radii[i], planePixel, 1.0);
    float weight = i == 1 ? 0.42 : 0.24;
    color = mix(color, STORY_INK, line * weight * occluded);
  }

  // The body: a matte sphere lit from the upper right, the night side settling
  // into the muted tone, with a faint limb hairline.
  if (insideBody) {
    vec2 local = (p - center) / bodyRadius;
    vec3 normal = vec3(local, sqrt(max(1.0 - dot(local, local), 0.0)));
    vec3 lightDirection = normalize(vec3(0.62, 0.48, 0.62));
    float diffuse = clamp(dot(normal, lightDirection), 0.0, 1.0);
    float terminator = smoothstep(-0.08, 0.5, dot(normal, lightDirection));
    vec3 lit = paper(0.12 + 0.18 * (1.0 - diffuse));
    vec3 night = paper(0.78);
    float relief = fbm(normal * 3.0 + vec3(0.0, 0.0, 1.7), STORY_OCTAVES) - 0.5;
    color = mix(night, lit, terminator) + relief * 0.025;
  }
  color = mix(color, STORY_INK, hairline(bodyDistance - bodyRadius, pixel, 0.9) * 0.35);

  // Orbits in front of the body (near half) are drawn over it.
  if (insideBody && q.y <= 0.0) {
    for (int i = 0; i < 3; i++) {
      float line = hairline(planeRadius - radii[i], planePixel, 1.0);
      color = mix(color, STORY_INK, line * 0.3);
    }
  }

  // Satellite on the middle orbit, with a short trailing arc.
  float angle = 2.35 + uTime * 0.035;
  vec2 satellite = fromPlane(vec2(cos(angle), sin(angle)) * radii[1], center);
  float satelliteDistance = length(p - satellite);
  float disc = 1.0 - smoothstep(0.0075 - pixel, 0.0075 + pixel, satelliteDistance);
  float hidden = 0.0;
  if (sin(angle) > 0.0 && length(satellite - center) < bodyRadius) hidden = 1.0;
  float planeAngle = atan(q.y, q.x);
  float behind = mod(angle - planeAngle + 6.28318530718, 6.28318530718);
  float trail = (1.0 - smoothstep(0.0, 0.55, behind)) * hairline(planeRadius - radii[1], planePixel, 1.6);
  color = mix(color, STORY_INK, trail * 0.4 * occluded);
  color = mix(color, STORY_INK, disc * (1.0 - hidden));

  finishStory(color);
}
