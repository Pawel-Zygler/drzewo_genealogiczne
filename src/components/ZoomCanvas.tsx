import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.5;

type Props = {
  width: number;
  height: number;
  /** Changing this key re-fits the drawing to the screen. */
  fitKey: string;
  /** Smallest zoom the automatic fit may pick on a phone, so text stays readable. */
  minFitPhone?: number;
  /** Drawing x to bring into view after fitting when the drawing is wider than the screen. */
  focusX?: number;
  className?: string;
  toolbar: React.ReactNode;
  /** Rendered over the view, unscaled (side panel, toasts). */
  overlay?: React.ReactNode;
  children: React.ReactNode;
};

/** Toolbar + scrollable, zoomable drawing area shared by the alternative views. */
export default function ZoomCanvas({ width, height, fitKey, minFitPhone = 0.45, focusX, className, toolbar, overlay, children }: Props) {
  const [zoom, setZoom] = useState(0.9);
  const scrollRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(width);
  widthRef.current = width;
  const focusRef = useRef(focusX);
  focusRef.current = focusX;

  const fit = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !widthRef.current) return;
    const avail = el.clientWidth - 16;
    let z = Math.min(1, avail / widthRef.current);
    if (el.clientWidth < 640) z = Math.max(z, minFitPhone);
    const zoomed = Math.max(MIN_ZOOM, Math.round(z * 100) / 100);
    setZoom(zoomed);
    const fx = focusRef.current;
    const left = fx === undefined ? 0 : Math.max(0, fx * zoomed - el.clientWidth / 2);
    // Scroll after React has resized the drawing to the new zoom.
    requestAnimationFrame(() => el.scrollTo({ left, top: 0 }));
  }, [minFitPhone]);

  const ready = width > 0;
  useLayoutEffect(() => {
    fit();
  }, [fit, fitKey, ready]);
  useEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [fit]);

  const step = (d: number) => setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + d) * 100) / 100)));

  return (
    <div className={`alt-view ${className || ''}`}>
      <div className="alt-toolbar">
        {toolbar}
        <div className="alt-zoom">
          <button onClick={() => step(-0.1)} aria-label="Pomniejsz">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => step(0.1)} aria-label="Powiększ">+</button>
          <button onClick={fit}>Dopasuj</button>
        </div>
      </div>
      <div ref={scrollRef} className="alt-scroll">
        <div style={{ width: width * zoom, height: height * zoom, position: 'relative' }}>
          <div style={{ width, height, transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'absolute', inset: '0 auto auto 0' }}>
            {children}
          </div>
        </div>
      </div>
      {overlay}
    </div>
  );
}
