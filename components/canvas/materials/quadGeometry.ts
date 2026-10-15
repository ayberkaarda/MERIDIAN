import { PlaneGeometry } from 'three';

/**
 * One clip-space quad shared by every full-frame and full-panel pass (sun
 * disc, grain overlay, story and technology panels). It is passed by
 * reference, so unmounting a mesh never disposes it; it lives as long as the
 * page.
 */
export const fullscreenQuad = new PlaneGeometry(2, 2);
