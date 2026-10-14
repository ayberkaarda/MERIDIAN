varying vec3 vObjectPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vCameraDistance;

void main() {
  vObjectPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  // The body is uniformly scaled, so the model matrix is safe for normals.
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vCameraDistance = distance(cameraPosition, modelMatrix[3].xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
