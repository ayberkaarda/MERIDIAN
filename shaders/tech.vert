// Full-panel quad for the technology visuals. The plane spans clip space
// directly; the scissor rectangle of the DOM panel supplies the bounds.

varying vec2 vUv;

void main() {
  vUv = uv;
  // z = -w puts the quad on the near plane (depth 0): it occludes scene objects
  // drawn after it inside the panel rect, while depth-test-free overlays still land on top.
  gl_Position = vec4(position.xy, -1.0, 1.0);
}
