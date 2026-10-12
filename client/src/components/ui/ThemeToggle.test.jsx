import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from './ThemeToggle.jsx';
import { ThemeProvider } from '../../context/ThemeContext.jsx';

describe('ThemeToggle', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders accessible theme toggle button and switches theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    expect(button).toBeTruthy();

    const initialLabel = button.getAttribute('aria-label');
    fireEvent.click(button);

    const updatedButton = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    expect(updatedButton.getAttribute('aria-label')).not.toBe(initialLabel);
  });
});
