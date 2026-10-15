import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { Scene, ShaderMaterial, type Mesh } from 'three';
import { stories } from '@/data/stories';
import { useMeridianStore } from '@/store';
import { createStoryMaterial, STORY_STILL_TIME, storyQuality, type StoryVisualKind } from '../materials/storyMaterials';
import { fullscreenQuad } from '../materials/quadGeometry';
import { PanelPass, usePanelLayer } from '../panels/PanelPass';

/*
 * The three editorial story images. Each registered story panel gets its own
 * off-graph scene with one full-panel quad, drawn by the shared panel pass
 * into the panel's rect. The quad always fills the whole transformed rect, so
 * a DOM scale on the panel scales the image with it, and a DOM clip-path
 * reveal narrows only the scissor. Without a registered panel nothing here is
 * mounted.
 */
export function StoryVisual() {
  const panels = useMeridianStore((state) => state.storyPanels);
  if (!panels.some((panel) => panel !== null)) return null;
  return (
    <>
      <PanelPass />
      {stories.map((story, index) => {
        const panel = panels[index];
        return panel ? <StoryLayer key={story.id} panel={panel} visual={story.visual} order={index} /> : null;
      })}
    </>
  );
}

interface StoryLayerProps {
  panel: HTMLElement;
  visual: StoryVisualKind;
  order: number;
}

function StoryLayer({ panel, visual, order }: StoryLayerProps) {
  const tier = useMeridianStore((state) => state.tier);
  const quality = storyQuality[tier];
  const [scene] = useState(() => new Scene());
  const material = useMemo(() => createStoryMaterial(visual, quality), [visual, quality]);
  const clock = useRef(STORY_STILL_TIME);
  const quad = useRef<Mesh>(null);

  useEffect(() => () => material.dispose(), [material]);

  const options = useMemo(
    () => ({
      order,
      onDraw: (width: number, height: number) => {
        const target = quad.current?.material;
        if (!(target instanceof ShaderMaterial)) return;
        const { uAspect } = target.uniforms;
        const aspect = width / height;
        if (uAspect && uAspect.value !== aspect) uAspect.value = aspect;
      },
    }),
    [order],
  );
  usePanelLayer(panel, scene, options);

  useFrame((_, delta) => {
    // Low tier keeps every uniform still; reduced motion freezes time.
    if (!quality.animated || useMeridianStore.getState().reducedMotion) return;
    clock.current += Math.min(delta, 0.1);
    const target = quad.current?.material;
    if (!(target instanceof ShaderMaterial)) return;
    const { uTime } = target.uniforms;
    if (uTime) uTime.value = clock.current;
  });

  return createPortal(
    <mesh ref={quad} geometry={fullscreenQuad} material={material} frustumCulled={false} />,
    scene,
  );
}
