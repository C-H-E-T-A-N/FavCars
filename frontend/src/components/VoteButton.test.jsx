import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoteButton from './VoteButton';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return { ...actual, getMe: vi.fn(), getVoteStatus: vi.fn(), voteForCar: vi.fn(), googleLoginUrl: 'http://localhost:8080/oauth2/authorization/google' };
});

function renderButton(onVoted = vi.fn()) {
  return render(<AuthProvider><VoteButton carId="car1" onVoted={onVoted} /></AuthProvider>);
}

describe('VoteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a Google sign-in link when logged out', async () => {
    api.getMe.mockResolvedValue({ authenticated: false, user: null });

    renderButton();

    const link = await screen.findByRole('link', { name: '❤️ Vote for this car' });
    expect(link).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/google');
  });

  it('lets a logged-in user who has not voted cast a vote', async () => {
    api.getMe.mockResolvedValue({ authenticated: true, user: { id: 'user1', name: 'Chetan' } });
    api.getVoteStatus.mockResolvedValue({ hasVoted: false });
    api.voteForCar.mockResolvedValue({ success: true, carId: 'car1', voteCount: 43, rank: 2 });
    const onVoted = vi.fn();

    renderButton(onVoted);

    const button = await screen.findByRole('button', { name: '❤️ VOTE FOR THIS CAR' });
    await userEvent.click(button);

    expect(await screen.findByRole('button', { name: '✓ VOTED' })).toBeDisabled();
    expect(onVoted).toHaveBeenCalledWith({ voteCount: 43, rank: 2 });
  });

  it('shows VOTED immediately for a car the user already voted for', async () => {
    api.getMe.mockResolvedValue({ authenticated: true, user: { id: 'user1', name: 'Chetan' } });
    api.getVoteStatus.mockResolvedValue({ hasVoted: true });

    renderButton();

    expect(await screen.findByRole('button', { name: '✓ VOTED' })).toBeDisabled();
    expect(api.voteForCar).not.toHaveBeenCalled();
  });

  it('handles a 409 from a race with another tab by locking the button and explaining why', async () => {
    api.getMe.mockResolvedValue({ authenticated: true, user: { id: 'user1', name: 'Chetan' } });
    api.getVoteStatus.mockResolvedValue({ hasVoted: false });
    api.voteForCar.mockRejectedValue({ response: { status: 409 } });

    renderButton();

    const button = await screen.findByRole('button', { name: '❤️ VOTE FOR THIS CAR' });
    await userEvent.click(button);

    await waitFor(() => expect(screen.getByText('You have already voted for this car.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '✓ VOTED' })).toBeDisabled();
  });
});
