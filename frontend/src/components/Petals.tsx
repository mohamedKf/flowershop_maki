import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  count?: number;
}

// Rose petal — single curved teardrop
const ROSE_PATH = 'M40 12 Q56 20 50 32 Q44 44 40 44 Q36 44 30 32 Q24 20 40 12 Z';

// Sakura petal — single rounded petal with notched tip
// Drawn around a 0,0 to 80,56 viewBox like the rose
const SAKURA_PATH =
  'M40 8 C50 12 56 22 54 32 C52 40 47 46 41 47 L41 44 L39 47 C33 46 28 40 26 32 C24 22 30 12 40 8 Z';

function rand(seed: number, n: number, lo: number, hi: number) {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  const f = x - Math.floor(x);
  return lo + f * (hi - lo);
}

/**
 * Falling petals. Rose (red gradient) for dark theme, sakura (pink-white) for light.
 * Uses CSS keyframes per-petal (deterministic seeded randomization) so the animation
 * is GPU-cheap and never reshuffles. Auto-disables for prefers-reduced-motion.
 */
export function Petals({ count }: Props) {
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Clear any existing petals (re-runs on theme change)
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    if (styleRef.current?.parentNode) {
      styleRef.current.parentNode.removeChild(styleRef.current);
      styleRef.current = null;
    }

    const isMobile = window.innerWidth < 700;
    const N = count ?? (isMobile ? 12 : 22);

    const isSakura = theme === 'light';
    const path = isSakura ? SAKURA_PATH : ROSE_PATH;

    const cssRules: string[] = [];

    for (let i = 1; i <= N; i++) {
      const size = isSakura
        ? rand(i, 1, 18, 32) // sakura slightly bigger feels more natural
        : rand(i, 1, 14, 28);
      const left = rand(i, 2, -5, 105);
      const dur = rand(i, 3, 14, 26);
      const delay = rand(i, 4, -dur, 0);
      const drift = rand(i, 5, 40, 140);
      const rotStart = rand(i, 6, 0, 360);
      const rotEnd = rotStart + rand(i, 7, 180, 540);
      const opacity = isSakura
        ? rand(i, 8, 0.55, 0.95) // sakura more visible on light bg
        : rand(i, 8, 0.35, 0.85);
      const swayDur = rand(i, 9, 4, 8);

      let tint: string;
      let midColor: string;
      let edgeColor: string;
      let veinColor: string;

      if (isSakura) {
        // Pink/white sakura colors
        const tintH = (Math.round(rand(i, 10, -8, 8)) + 340 + 360) % 360; // pink range
        const tintS = Math.round(rand(i, 11, 35, 70));
        const tintL = Math.round(rand(i, 12, 88, 96));
        tint = `hsl(${tintH}, ${tintS}%, ${tintL}%)`;
        midColor = '#f5b8c8'; // soft pink mid
        edgeColor = '#d4869b'; // dusty rose edge
        veinColor = 'rgba(180, 90, 110, 0.25)';
      } else {
        // Red rose colors (current behavior)
        const tintH = (Math.round(rand(i, 10, -8, 8)) + 355 + 360) % 360;
        const tintS = Math.round(rand(i, 11, 60, 90));
        const tintL = Math.round(rand(i, 12, 28, 48));
        tint = `hsl(${tintH}, ${tintS}%, ${tintL}%)`;
        midColor = '#c8102e';
        edgeColor = '#3a0008';
        veinColor = 'rgba(255, 255, 255, 0.18)';
      }

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

      const veinPath = isSakura
        ? '' // sakura looks cleaner without a vein highlight
        : `<path d="M40 14 Q42 28 40 42" stroke="${veinColor}" stroke-width="0.6" fill="none"/>`;

      petal.innerHTML = `
        <svg viewBox="0 0 80 56" width="100%" height="100%" style="display:block">
          <defs>
            <radialGradient id="pg-${i}-${theme}" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stop-color="${tint}" stop-opacity="1"/>
              <stop offset="60%" stop-color="${midColor}" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="${edgeColor}" stop-opacity="${isSakura ? 0.7 : 0.9}"/>
            </radialGradient>
          </defs>
          <path d="${path}" fill="url(#pg-${i}-${theme})"/>
          ${veinPath}
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
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
      if (styleRef.current?.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
      }
    };
  }, [theme, count]);

  return <div className="petals" ref={wrapRef} aria-hidden="true" />;
}
