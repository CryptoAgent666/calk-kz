import React, { useEffect, useRef, useState } from 'react';

interface DeferredRenderProps {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
  minHeight?: number;
  style?: React.CSSProperties;
}

export function DeferredRender({
  children,
  className,
  rootMargin = '200px 0px',
  minHeight = 280,
  style
}: DeferredRenderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isVisible) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    const node = containerRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: `1px ${Math.max(minHeight, 1)}px`,
        minHeight: isVisible ? undefined : minHeight,
        ...style
      }}
    >
      {isVisible ? children : null}
    </div>
  );
}
