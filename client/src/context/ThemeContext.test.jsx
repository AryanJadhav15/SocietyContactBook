import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';

function ConsumerComponent() {
  const { theme, toggleTheme, isDark } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'yes' : 'no'}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light or system and toggles between light and dark', () => {
    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle/i });
    const initialTheme = screen.getByTestId('theme-val').textContent;

    fireEvent.click(toggleBtn);

    const nextTheme = screen.getByTestId('theme-val').textContent;
    expect(nextTheme).not.toBe(initialTheme);
    expect(localStorage.getItem('theme')).toBe(nextTheme);

    // Toggle back
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('theme-val').textContent).toBe(initialTheme);
  });

  it('restores theme preference from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark').textContent).toBe('yes');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
