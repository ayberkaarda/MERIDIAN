// Procedural sun disc. Requires noise.glsl to be prepended and SURFACE_OCTAVES
// to be defined. Calm and pale by design: soft limb darkening towards a
// neutral grey and a low-contrast granulation, no corona and no glow. As the
// disc fills the frame the surface flattens into the light page colour, so the
// handoff to the DOM background is exact.

uniform float uAspect;
// Disc centre and radius in half-height units (y in -1..1, x in -aspect..aspect).
uniform vec2 uCenter;
uniform float uRadius;
// 1 shows the full surface, 0 the flat page colour.
uniform float uDetail;
uniform float uOpacity;
uniform float uTime;
uniform vec3 uSurface;
uniform vec3 uLimb;
uniform vec3 uFlat;

varying vec2 vScreen;

void main() {
  vec2 point = vec2(vScreen.x * uAspect, vScreen.y);
  vec2 q = (point - uCenter) / uRadius;
  float r = length(q);
  // About one pixel of edge in disc units.
  float edge = max(fwidth(r), 1e-5) * 1.25;
  float disc = 1.0 - smoothstep(1.0 - edge, 1.0, r);
  if (disc <= 0.0) discard;

  vec3 color = uFlat;
  if (uDetail > 0.001) {
    // Cosine of the angle to the surface normal on the visible hemisphere.
    float mu = sqrt(max(0.0, 1.0 - r * r));
    vec3 normal = vec3(q, mu);
    vec3 surface = mix(uLimb, uSurface, pow(mu, 0.42));
    // Granulation compresses towards the limb because it is sampled on the sphere.
    vec3 drift = vec3(uTime * 0.004, uTime * 0.0025, 0.0);
    float cells = fbm(normal * 22.0 + drift, SURFACE_OCTAVES);
    float mottling = fbm(normal * 2.6 + vec3(11.0, 3.0, 7.0), 2);
    surface *= 1.0 + (cells - 0.5) * 0.07 + (mottling - 0.5) * 0.05;
    color = mix(uFlat, surface, uDetail);
  }

  gl_FragColor = vec4(color, disc * uOpacity);

  #include <colorspace_fragment>
}
