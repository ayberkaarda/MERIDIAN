// Procedural planet surface. Requires noise.glsl to be prepended and the
// TERRAIN_OCTAVES, CLOUD_OCTAVES and DOMAIN_WARP defines to be set.

uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uRimColor;
uniform float uTime;
uniform float uSaturation;
// Overall surface gain (1 = hero); the closing act lowers it behind the type.
uniform float uExposure;

varying vec3 vObjectPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vCameraDistance;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec3 rotateY(vec3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

void main() {
  vec3 surface = normalize(vObjectPosition);

  // Terrain height field.
  vec3 q = surface * 1.8;
#if DOMAIN_WARP == 1
  q += 0.55 * vec3(fbm(q + vec3(1.7, 9.2, 3.1), 3));
#endif
  float height = fbm(q, TERRAIN_OCTAVES);

  float latitude = abs(surface.y);
  float landMask = smoothstep(0.5, 0.56, height);
  float relief = smoothstep(0.56, 0.78, height);

  vec3 ocean = mix(vec3(0.030, 0.036, 0.042), vec3(0.055, 0.060, 0.064), smoothstep(0.3, 0.5, height));
  vec3 land = mix(vec3(0.150, 0.142, 0.132), vec3(0.380, 0.372, 0.360), relief);
  vec3 albedo = mix(ocean, land, landMask);

  // Polar caps, broken up by the height field so the edge is not a ring.
  float ice = smoothstep(0.78, 0.9, latitude + (height - 0.5) * 0.35);
  albedo = mix(albedo, vec3(0.62, 0.62, 0.61), ice);

#if CLOUD_OCTAVES > 0
  vec3 cloudPoint = rotateY(surface, uTime * 0.006) * 2.6 + vec3(0.0, 4.0, 0.0);
  float cloud = smoothstep(0.52, 0.78, fbm(cloudPoint, CLOUD_OCTAVES));
  cloud *= 1.0 - ice * 0.6;
  albedo = mix(albedo, vec3(0.58, 0.58, 0.57), cloud * 0.55);
#else
  float cloud = 0.0;
#endif

  vec3 normal = normalize(vWorldNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  vec3 lightDirection = normalize(uLightDirection);
  float facing = dot(normal, lightDirection);

  // Soft terminator: a narrow wrap keeps the night side close to black.
  float diffuse = smoothstep(-0.06, 0.9, facing) * clamp(facing + 0.06, 0.0, 1.0);

  // Restrained sun glint on open water only.
  vec3 halfVector = normalize(lightDirection + viewDirection);
  float glint = pow(max(dot(normal, halfVector), 0.0), 48.0) * (1.0 - landMask) * (1.0 - cloud) * 0.18;

  // Thin atmospheric rim, strongest on the lit limb.
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 4.0);
  float rim = fresnel * smoothstep(-0.25, 0.55, facing);

  // A trace of earthshine keeps the night side a discernible disc, not a hole.
  vec3 color = albedo * (diffuse * uLightColor + 0.012) + glint * uLightColor + rim * uRimColor * 0.55;

  // Heavy desaturation keeps the body documentary rather than illustrative.
  color = mix(vec3(dot(color, LUMA)), color, uSaturation);

  // At departure distances the body reads as a faint point, not a lit disc.
  color *= mix(1.0, 0.72, smoothstep(24.0, 320.0, vCameraDistance));

  gl_FragColor = vec4(color * uExposure, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
