// Back-face halo shell around the planet. Only the annulus between the body's
// silhouette and the shell's silhouette is visible; uEdge is the |dot(n, v)|
// value at the body's silhouette, so the halo fades from there to zero.

uniform vec3 uLightDirection;
uniform vec3 uRimColor;
uniform float uEdge;
uniform float uIntensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float depth = clamp(-dot(normal, viewDirection) / uEdge, 0.0, 1.0);
  float halo = depth * depth * depth;
  float lit = smoothstep(-0.3, 0.6, dot(normal, normalize(uLightDirection)));
  float alpha = halo * lit * uIntensity;

  gl_FragColor = vec4(uRimColor, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
