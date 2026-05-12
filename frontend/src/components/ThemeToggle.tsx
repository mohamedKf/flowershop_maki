import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className="w-10 h-10 border border-rule flex items-center justify-center hover:border-red hover:text-red transition-all relative overflow-hidden group"
    >
      <Sun
        className={`w-4 h-4 absolute transition-all duration-500 ${
          isDark
            ? 'opacity-0 -rotate-90 scale-0'
            : 'opacity-100 rotate-0 scale-100'
        }`}
      />
      <Moon
        className={`w-4 h-4 absolute transition-all duration-500 ${
          isDark
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 rotate-90 scale-0'
        }`}
      />
    </button>
  );
}
