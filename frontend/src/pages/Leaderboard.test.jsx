import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Leaderboard from './Leaderboard';
import * as api from '../services/api';

vi.mock('../services/api');

const entry = (rank, id, make, model, votes) => ({
  rank, votes, car: { id, make, model, year: 2026, country: null, bodyType: 'Coupe', image: null },
});

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.getStats.mockResolvedValue({ totalCars: 5479, totalVotes: 42, totalCountries: 14 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the top 3 and the rest of the table from the API', async () => {
    api.getLeaderboard.mockResolvedValue({
      content: [
        entry(1, 'car1', 'Porsche', '911', 184293),
        entry(2, 'car2', 'BMW', 'M3', 176821),
        entry(3, 'car3', 'Ferrari', '296 GTB', 169442),
        entry(4, 'car4', 'Lamborghini', 'Revuelto', 162103),
      ],
      page: 0,
      totalPages: 1,
      totalElements: 4,
    });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    expect(await screen.findByText('Porsche')).toBeInTheDocument();
    expect(screen.getByText('184,293')).toBeInTheDocument();
    expect(screen.getByText('Lamborghini Revuelto')).toBeInTheDocument();
  });

  it('shows a friendly empty state when nobody has voted yet', async () => {
    api.getLeaderboard.mockResolvedValue({ content: [], page: 0, totalPages: 0, totalElements: 0 });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    expect(await screen.findByText(/No votes yet/)).toBeInTheDocument();
  });

  it('shows real stats from the API in the hero, not fabricated numbers', async () => {
    api.getLeaderboard.mockResolvedValue({ content: [], page: 0, totalPages: 0, totalElements: 0 });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);

    expect(await screen.findByText('5.5K+')).toBeInTheDocument();
    expect(screen.getByText('14+')).toBeInTheDocument();
  });

  it('polls the leaderboard again after the interval elapses', async () => {
    api.getLeaderboard.mockResolvedValue({ content: [], page: 0, totalPages: 0, totalElements: 0 });

    render(<MemoryRouter><Leaderboard /></MemoryRouter>);
    await screen.findByText(/No votes yet/);
    const callsAfterFirstLoad = api.getLeaderboard.mock.calls.length;

    await vi.advanceTimersByTimeAsync(7000);
    expect(api.getLeaderboard.mock.calls.length).toBeGreaterThan(callsAfterFirstLoad);
  });
});
