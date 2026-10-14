// Faceted bodies of the orbital system (core and the small orbiting bodies).
// Instanced meshes get USE_INSTANCING and the instanceMatrix attribute from three.

varying vec3 vWorldPosition;

void main() {
  vec4 local = vec4(position, 1.0);
#ifdef USE_INSTANCING
  local = instanceMatrix * local;
#endif
  vec4 worldPosition = modelMatrix * local;
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
