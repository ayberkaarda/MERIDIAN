// Film grain and vignette composited over the scene with normal blending.
// Values are display-referred; no tone mapping or colour-space conversion.

uniform float uTime;
uniform float uAspect;
uniform float uGrain;
uniform float uVignette;

varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 centered = (vUv - 0.5) * vec2(uAspect, 1.0);
  float radius = length(centered) / length(vec2(uAspect, 1.0) * 0.5);
  float vignette = smoothstep(0.45, 1.1, radius) * uVignette;

  // Grain is stepped at 24 fps so it reads as film, not as screen flicker.
  float frame = floor(uTime * 24.0);
  float grain = hash12(gl_FragCoord.xy + vec2(frame * 37.0, frame * 17.0));
  float grainAlpha = uGrain * (1.0 - vignette);

  float alpha = vignette + grainAlpha;
  vec3 color = vec3(grain) * grainAlpha / max(alpha, 1e-4);

  gl_FragColor = vec4(color, alpha);
}
