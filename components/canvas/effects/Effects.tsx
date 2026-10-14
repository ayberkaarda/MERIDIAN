import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, type Mesh } from 'three';
import { useMeridianStore } from '@/store';
import { createGrainMaterial, grainQuality } from '../materials/grainMaterial';

/**
 * Film grain and vignette as a single full-screen overlay drawn last.
 * One blended fragment pass over the default framebuffer: no extra render
 * target, no MSAA resolve and no copy pass, which an EffectComposer would add.
 * Only the high tier draws it; mid/low use the static CSS `.scene-vignette`
 * (styles/scene.css) so no full-screen fragment pass runs on those devices.
 */
export function Effects() {
  const tier = useMeridianStore((state) => state.tier);
  return tier === 'high' ? <GrainOverlay /> : null;
}

function GrainOverlay() {
  const material = useMemo(() => createGrainMaterial(grainQuality), []);
  const overlay = useRef<Mesh>(null);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ size }, delta) => {
    const target = overlay.current?.material;
    if (!(target instanceof ShaderMaterial)) return;
    const aspect = target.uniforms.uAspect;
    if (aspect) aspect.value = size.width / Math.max(1, size.height);
    // Reduced motion keeps a fixed grain pattern.
    if (useMeridianStore.getState().reducedMotion) return;
    const time = target.uniforms.uTime;
    if (time) time.value += Math.min(delta, 0.1);
  });

  return (
    <mesh ref={overlay} material={material} frustumCulled={false} renderOrder={1000}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
