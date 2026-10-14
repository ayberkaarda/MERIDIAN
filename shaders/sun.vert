// The sun is drawn as a clip-space quad on the far plane: it ignores the camera,
// so its disc is laid out in screen units, and anything in the scene with depth
// (the craft against the rising disc, the planet) still draws in front of it.
varying vec2 vScreen;

void main() {
  vScreen = position.xy;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
