import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../context';
import './ThemeToggle.css';

/**
 * Accessible, animated ThemeToggle button for Light/Dark mode switching.
 */
export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-theme={theme}
    >
      <div className="theme-toggle__icon-container">
        {isDark ? (
          <Sun size={17} className="theme-toggle__icon theme-toggle__icon--sun" />
        ) : (
          <Moon size={17} className="theme-toggle__icon theme-toggle__icon--moon" />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle__label">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
