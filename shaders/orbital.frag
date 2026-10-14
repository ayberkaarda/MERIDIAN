// Matte, faceted shading: the face normal comes from screen-space derivatives of
// the world position, so every facet reads as a flat plane of a machined body.

uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uAlbedo;
uniform vec3 uRimColor;
uniform float uFade;

varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  // Derivative normals can point either way; face them toward the viewer.
  normal *= sign(dot(normal, viewDirection) + 1e-4);

  vec3 lightDirection = normalize(uLightDirection);
  float facing = dot(normal, lightDirection);
  float diffuse = clamp(facing, 0.0, 1.0);
  // A narrow cool rim separates the dark side from the near-black background.
  float rim = pow(1.0 - clamp(dot(normal, viewDirection), 0.0, 1.0), 3.0) * 0.35;

  vec3 color = uAlbedo * (diffuse * uLightColor + 0.035) + rim * uRimColor;
  gl_FragColor = vec4(color * uFade, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
