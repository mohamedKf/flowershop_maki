import { useEffect, useRef } from 'react';

interface Props {
  count?: number;
}

const PETAL_PATH = 'M40 12 Q56 20 50 32 Q44 44 40 44 Q36 44 30 32 Q24 20 40 12 Z';

function rand(seed: number, n: number, lo: number, hi: number) {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  const f = x - Math.floor(x);
  return lo + f * (hi - lo);
}

/**
 * Falling rose petals. Uses CSS keyframes per-petal (deterministic seeded
 * randomization) so the animation is GPU-cheap and never reshuffles.
 *
 * Auto-disables on small screens or when prefers-reduced-motion is set.
 */
export function Petals({ count }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Adapt count to screen size
    const isMobile = window.innerWidth < 700;
    const N = count ?? (isMobile ? 12 : 22);

    const cssRules: string[] = [];

    for (let i = 1; i <= N; i++) {
      const size = rand(i, 1, 14, 28);
      const left = rand(i, 2, -5, 105);
      const dur = rand(i, 3, 14, 26);
      const delay = rand(i, 4, -dur, 0);
      const drift = rand(i, 5, 40, 140);
      const rotStart = rand(i, 6, 0, 360);
      const rotEnd = rotStart + rand(i, 7, 180, 540);
      const opacity = rand(i, 8, 0.35, 0.85);
      const swayDur = rand(i, 9, 4, 8);
      const tintH = (Math.round(rand(i, 10, -8, 8)) + 355 + 360) % 360;
      const tintS = Math.round(rand(i, 11, 60, 90));
      const tintL = Math.round(rand(i, 12, 28, 48));
      const tint = `hsl(${tintH}, ${tintS}%, ${tintL}%)`;

      const petal = document.createElement('div');
      petal.className = 'petal';
      petal.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        opacity: ${opacity};
        animation:
          petal-fall-${i} ${dur}s linear ${delay}s infinite,
          petal-sway-${i} ${swayDur}s ease-in-out ${delay}s infinite alternate;
      `;

      petal.innerHTML = `
        <svg viewBox="0 0 80 56" width="100%" height="100%" style="display:block">
          <defs>
            <radialGradient id="pg-${i}" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stop-color="${tint}" stop-opacity="1"/>
              <stop offset="60%" stop-color="#c8102e" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#3a0008" stop-opacity="0.9"/>
            </radialGradient>
          </defs>
          <path d="${PETAL_PATH}" fill="url(#pg-${i})"/>
          <path d="M40 14 Q42 28 40 42" stroke="rgba(255,255,255,.18)" stroke-width="0.6" fill="none"/>
        </svg>
      `;
      wrap.appendChild(petal);

      cssRules.push(`
        @keyframes petal-fall-${i} {
          0% { transform: translate3d(0, 0, 0) rotate(${rotStart}deg); }
          100% { transform: translate3d(0, calc(100vh + 80px), 0) rotate(${rotEnd}deg); }
        }
        @keyframes petal-sway-${i} {
          0% { margin-left: ${-drift / 2}px; }
          100% { margin-left: ${drift / 2}px; }
        }
      `);
    }

    const style = document.createElement('style');
    style.textContent = cssRules.join('\n');
    document.head.appendChild(style);
    styleRef.current = style;

    return () => {
      // cleanup on unmount
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
      }
    };
  }, [count]);

  return <div className="petals" ref={wrapRef} aria-hidden="true" />;
}
