// 03 THE JOURNEY: a bundle of candidate transfer paths. Every path leaves the
// same origin and arrives at the same destination; they differ only in how
// far they bow, like a family of trajectories under study. One path is the
// chosen leg: drawn in ink, solid where it has been flown and dashed ahead,
// with a small craft marker at the current position that advances slowly.

const int PATHS = 9;
const int CHOSEN = 5;

// Height of path `bow` at x, and its slope, for endpoints a and b. `bow` is
// the path's peak offset from the straight chord, reached halfway along.
vec2 pathAt(float x, vec2 a, vec2 b, float bow) {
  float width = b.x - a.x;
  float u = (x - a.x) / width;
  float y = mix(a.y, b.y, u) + bow * 4.0 * u * (1.0 - u);
  float slope = (b.y - a.y) / width + bow * 4.0 * (1.0 - 2.0 * u) / width;
  return vec2(y, slope);
}

float bowOf(int index) {
  return mix(-0.2, 0.3, float(index) / float(PATHS - 1));
}

void main() {
  vec2 p = storyPoint();
  float pixel = length(fwidth(p)) * 0.7071;
  vec2 origin = vec2(-0.4 * uAspect, -0.27);
  vec2 destination = vec2(0.4 * uAspect, 0.2);

  // Field: brightest near the origin, settling toward the destination, as if
  // light falls off with distance travelled.
  float depth = clamp((p.x - origin.x) / (destination.x - origin.x), 0.0, 1.0);
  float haze = fbm(vec3(p * 1.4, 2.3 + uTime * 0.008), STORY_OCTAVES) - 0.5;
  vec3 color = paper(0.03 + 0.14 * depth * depth + 0.03 * haze);

  float span = step(origin.x, p.x) * step(p.x, destination.x);
  // Paths converge at both ends; fade them there so they do not merge into a blot.
  float endFade = smoothstep(0.0, 0.12, p.x - origin.x) * smoothstep(0.0, 0.12, destination.x - p.x);

  for (int i = 0; i < PATHS; i++) {
    if (i == CHOSEN) continue;
    vec2 path = pathAt(p.x, origin, destination, bowOf(i));
    float dist = (p.y - path.x) / sqrt(1.0 + path.y * path.y);
    color = mix(color, STORY_MUTED, hairline(dist, pixel, 0.8) * 0.55 * span * endFade);
  }

  // The chosen leg.
  float progress = 0.58 + 0.06 * sin(uTime * 0.03);
  float markerX = mix(origin.x, destination.x, progress);
  vec2 chosen = pathAt(p.x, origin, destination, bowOf(CHOSEN));
  float chosenDistance = (p.y - chosen.x) / sqrt(1.0 + chosen.y * chosen.y);
  float arc = (p.x - origin.x) * sqrt(1.0 + chosen.y * chosen.y);
  float dash = step(0.45, fract(arc * 42.0));
  float flown = step(p.x, markerX);
  float chosenLine = hairline(chosenDistance, pixel, 1.1) * span;
  color = mix(color, STORY_INK, chosenLine * mix(dash * 0.45, 0.85, flown));

  // Craft marker: a small disc with a hairline halo.
  vec2 marker = vec2(markerX, pathAt(markerX, origin, destination, bowOf(CHOSEN)).x);
  float markerDistance = length(p - marker);
  color = mix(color, STORY_INK, 1.0 - smoothstep(0.006 - pixel, 0.006 + pixel, markerDistance));
  color = mix(color, STORY_INK, hairline(markerDistance - 0.022, pixel, 0.8) * 0.5);

  // Origin: a solid body. Destination: an open ring with its capture orbit.
  float originDistance = length(p - origin);
  float destinationDistance = length(p - destination);
  color = mix(color, STORY_INK, 1.0 - smoothstep(0.014 - pixel, 0.014 + pixel, originDistance));
  color = mix(color, STORY_INK, hairline(destinationDistance - 0.011, pixel, 1.2) * 0.85);
  color = mix(color, STORY_MUTED, hairline(destinationDistance - 0.045, pixel, 0.8) * 0.6);

  finishStory(color);
}
