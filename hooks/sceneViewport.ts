export function observeSceneViewport(canvas: HTMLCanvasElement, onResize: (size: { width: number; height: number; top: number; left: number }) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const container = canvas.parentElement ?? canvas;
  const publish = () => {
    const { width, height, top, left } = container.getBoundingClientRect();
    if (width > 0 && height > 0) onResize({ width, height, top, left });
  };
  const observer = new ResizeObserver(publish);
  observer.observe(container);
  publish();
  return () => observer.disconnect();
}
