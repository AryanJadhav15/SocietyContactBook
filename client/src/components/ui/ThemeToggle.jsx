import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-ring ${className}`}
    >
      {isDark ? (
        <Sun size={17} className="text-[var(--color-accent)] transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon size={17} className="text-[var(--color-text-primary)] transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
