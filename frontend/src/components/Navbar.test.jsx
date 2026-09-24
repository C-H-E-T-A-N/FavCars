import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return { ...actual, getMe: vi.fn(), logout: vi.fn(), googleLoginUrl: 'http://localhost:8080/oauth2/authorization/google' };
});

function renderNavbar() {
  return render(<MemoryRouter><AuthProvider><Navbar /></AuthProvider></MemoryRouter>);
}

describe('Navbar', () => {
  it('shows a Google login link when logged out', async () => {
    api.getMe.mockResolvedValue({ authenticated: false, user: null });

    renderNavbar();

    const link = await screen.findByRole('link', { name: 'Continue with Google' });
    expect(link).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/google');
  });

  it('shows the authenticated user once logged in', async () => {
    api.getMe.mockResolvedValue({ authenticated: true, user: { name: 'Chetan', profileImage: null } });

    renderNavbar();

    expect(await screen.findByText('Chetan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
