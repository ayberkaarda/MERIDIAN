import { CRAFT_POSITION, craftLocalToWorld } from './cameraPath';

export type CraftAnchorId = 'radiator' | 'docking' | 'bus';

export interface CraftAnchor {
  id: CraftAnchorId;
  position: [number, number, number];
  /** Unit world direction the anchored surface faces. */
  normal: [number, number, number];
  /**
   * Smallest dot(normal, direction to camera) at which the anchor counts as
   * seen. Below it the part hides the point (the far wing, the ring behind the
   * habitat module, the top of the bus from below).
   */
  minFacing: number;
}

interface LocalAnchor {
  id: CraftAnchorId;
  position: readonly [number, number, number];
  normal: readonly [number, number, number];
  minFacing: number;
}

/**
 * Label anchors in the craft's local frame (long axis X, docking ring at -X,
 * radiator wings along +/-Z). They match the layout in bodies/Spacecraft.tsx:
 * the middle of the +Z radiator wing, the top of the docking ring and the
 * upper face of the hexagonal main bus.
 */
const craftAnchorsLocal: readonly LocalAnchor[] = [
  // Upper face of the +Z wing, leaning outward: hidden once the camera is behind the bus.
  { id: 'radiator', position: [0.46, 0.02, 1.6], normal: [0, 0.45, 0.89], minFacing: 0 },
  // The ring stands proud of the nose, so it reads from the side; it is lost only
  // when the camera is nearly end-on from aft and the habitat module covers it.
  { id: 'docking', position: [-3.45, 0.36, 0], normal: [-1, 0, 0], minFacing: -0.85 },
  // Flat upper face of the hexagonal bus.
  { id: 'bus', position: [0.25, 0.42, 0], normal: [0, 1, 0], minFacing: 0 },
];

function toWorldDirection(local: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(local[0], local[1], local[2]) || 1;
  const moved = craftLocalToWorld([local[0] / length, local[1] / length, local[2] / length]);
  return [moved[0] - CRAFT_POSITION[0], moved[1] - CRAFT_POSITION[1], moved[2] - CRAFT_POSITION[2]];
}

/**
 * World positions and facing of the three label anchors. The craft never moves
 * or turns, so these are fixed and can be projected with the camera each frame.
 */
export const craftAnchors: CraftAnchor[] = craftAnchorsLocal.map(({ id, position, normal, minFacing }) => ({
  id,
  position: craftLocalToWorld(position),
  normal: toWorldDirection(normal),
  minFacing,
}));

const displaced: [number, number, number] = [0, 0, 0];
/** Translation-only inspection groups keep their original facing normals. */
export function moveCraftAnchor(index: number, x: number, y: number, z: number): void {
  const local = craftAnchorsLocal[index];
  const anchor = craftAnchors[index];
  if (!local || !anchor) return;
  displaced[0] = local.position[0] + x;
  displaced[1] = local.position[1] + y;
  displaced[2] = local.position[2] + z;
  craftLocalToWorld(displaced, anchor.position);
}
