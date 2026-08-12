import { useEffect, useRef, useState } from 'react';
import { galeriaService, type GaleriaItem } from '@/services/galeriaService';
import styles from './GaleriaCarrusel.module.css';

export function GaleriaCarrusel() {
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const posRef = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);

  useEffect(() => {
    galeriaService.getPublicImages().then(data => {
      setItems(data);
      setIsLoading(false);
    });
  }, []);

  // Auto-scroll loop
  useEffect(() => {
    if (items.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    const SPEED = 0.5; // px per frame

    const animate = () => {
      if (!pausedRef.current && !isDragging.current) {
        posRef.current += SPEED;
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) {
          posRef.current -= halfWidth;
        }
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [items]);

  // Touch/mouse drag handlers
  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    pausedRef.current = true;
    dragStartX.current = clientX;
    dragStartPos.current = posRef.current;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    const delta = dragStartX.current - clientX;
    const track = trackRef.current;
    if (!track) return;
    const halfWidth = track.scrollWidth / 2;
    let newPos = dragStartPos.current + delta;
    if (newPos < 0) newPos = 0;
    if (newPos >= halfWidth) newPos = halfWidth - 1;
    posRef.current = newPos;
    track.style.transform = `translateX(-${posRef.current}px)`;
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    // Resume after short pause
    setTimeout(() => { pausedRef.current = false; }, 800);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingPlaceholder}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Próximamente verás trabajos realizados aquí.</p>
      </div>
    );
  }

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { if (!isDragging.current) pausedRef.current = false; }}
    >
      <div
        className={styles.track}
        ref={trackRef}
        onMouseDown={e => handleDragStart(e.clientX)}
        onMouseMove={e => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={e => handleDragStart(e.touches[0].clientX)}
        onTouchMove={e => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        {doubled.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className={styles.slide}>
            <img
              src={item.imagen_url}
              alt={item.descripcion ?? `Trabajo realizado ${idx + 1}`}
              className={styles.img}
              draggable={false}
              loading="lazy"
            />
            {item.descripcion && (
              <div className={styles.caption}>{item.descripcion}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
