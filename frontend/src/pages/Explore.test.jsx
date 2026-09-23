import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Explore from './Explore';
import * as api from '../services/api';

vi.mock('../services/api');

const car = (id, make, model) => ({ id, make, model, year: 2026, country: 'Germany', bodyType: 'Sedan', image: null });

describe('Explore', () => {
  it('loads and displays cars from the API', async () => {
    api.getCars.mockResolvedValue({ content: [car('1', 'BMW', 'M3')], page: 0, totalPages: 1, totalElements: 1 });

    render(<MemoryRouter><Explore /></MemoryRouter>);

    expect(await screen.findByText('BMW')).toBeInTheDocument();
    expect(screen.getByText('M3')).toBeInTheDocument();
    expect(api.getCars).toHaveBeenCalledWith(0);
  });

  it('searches via the API when a query is submitted', async () => {
    api.getCars.mockResolvedValue({ content: [car('1', 'BMW', 'M3')], page: 0, totalPages: 1, totalElements: 1 });
    api.searchCars.mockResolvedValue({ content: [car('2', 'BMW', 'M4')], page: 0, totalPages: 1, totalElements: 1 });

    render(<MemoryRouter><Explore /></MemoryRouter>);
    await screen.findByText('BMW');

    await userEvent.type(screen.getByPlaceholderText('Search cars...'), 'BMW{Enter}');

    await waitFor(() => expect(api.searchCars).toHaveBeenCalledWith('BMW', 0));
  });

  it('requests the next page when pagination is clicked', async () => {
    api.getCars.mockResolvedValue({ content: [car('1', 'BMW', 'M3')], page: 0, totalPages: 3, totalElements: 60 });

    render(<MemoryRouter><Explore /></MemoryRouter>);
    await screen.findByText('BMW');

    await userEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(api.getCars).toHaveBeenLastCalledWith(1));
  });
});
