import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, login: vi.fn() })
}));

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });
});
