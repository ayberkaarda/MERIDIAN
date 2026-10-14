// Full-screen overlay: the plane is emitted directly in clip space, so it
// ignores the camera and always covers the viewport.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
