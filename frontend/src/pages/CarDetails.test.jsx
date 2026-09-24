import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CarDetails from './CarDetails';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

vi.mock('../services/api');

function renderCarDetails(id) {
  return render(
    <MemoryRouter initialEntries={[`/cars/${id}`]}>
      <AuthProvider>
        <Routes><Route path="/cars/:id" element={<CarDetails />} /></Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('CarDetails', () => {
  it('renders the fetched car specifications', async () => {
    api.getMe.mockResolvedValue({ authenticated: false, user: null });
    api.getCar.mockResolvedValue({
      id: '1', make: 'BMW', model: 'M3', year: 2026, variant: 'Competition', country: 'Germany',
      bodyType: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', drivetrain: 'RWD',
      engine: { name: 'S58', displacementCc: 2993, cylinders: 6, horsepower: 523 },
      image: null,
    });
    api.getRanking.mockResolvedValue({ carId: '1', rank: 2, votes: 176821 });
    api.getVoteStatus.mockResolvedValue({ hasVoted: false });

    renderCarDetails('1');

    expect(await screen.findByRole('heading', { name: /BMW\s*M3 Competition/ })).toBeInTheDocument();
    expect(screen.getByText('523 hp')).toBeInTheDocument();
    expect(screen.getByText('Competition')).toBeInTheDocument();
    expect(screen.getByText('#2 GLOBAL RANK')).toBeInTheDocument();
  });

  it('shows a not-found message for a missing car', async () => {
    api.getMe.mockResolvedValue({ authenticated: false, user: null });
    api.getCar.mockRejectedValue(new Error('404'));
    api.getRanking.mockResolvedValue({ carId: 'missing', rank: null, votes: 0 });

    renderCarDetails('missing');

    expect(await screen.findByText('Car not found.')).toBeInTheDocument();
  });
});
