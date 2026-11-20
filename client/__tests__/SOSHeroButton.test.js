import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SOSHeroButton } from '../src/components/sos/SOSHeroButton.js';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Create a dummy store for testing
const createTestStore = (initialState) => {
  return configureStore({
    reducer: {
      auth: (state = { user: { fullName: 'Test User' } }) => state,
      sos: (state = initialState.sos) => state,
      location: (state = initialState.location) => state,
    },
    preloadedState: initialState,
  });
};

describe('SOSHeroButton Component - Unit Tests', () => {
  let store;

  beforeEach(() => {
    store = createTestStore({
      sos: {
        activeSession: null,
        status: 'IDLE',
      },
      location: {
        latitude: 18.5204,
        longitude: 73.8567,
      },
    });

    store.dispatch = jest.fn(store.dispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the SOS button in initial idle state', () => {
    render(
      <Provider store={store}>
        <SOSHeroButton />
      </Provider>
    );

    expect(screen.getByText('SOS')).toBeInTheDocument();
    expect(screen.getByText('HOLD 3 SECONDS')).toBeInTheDocument();
    expect(
      screen.getByText(/Press & hold for 3 seconds to broadcast emergency GPS location/i)
    ).toBeInTheDocument();
  });

  it('shows STOP button when an emergency session is active', () => {
    const activeStore = createTestStore({
      sos: {
        activeSession: { id: 'sos-123', status: 'ACTIVE' },
        status: 'ACTIVE',
      },
      location: {
        latitude: 18.5204,
        longitude: 73.8567,
      },
    });

    render(
      <Provider store={activeStore}>
        <SOSHeroButton />
      </Provider>
    );

    expect(screen.getByText('STOP')).toBeInTheDocument();
  });

  it('toggles silent emergency mode when clicked', () => {
    render(
      <Provider store={store}>
        <SOSHeroButton />
      </Provider>
    );

    const toggleBtn = screen.getByRole('button', { name: /Silent Emergency Mode/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText(/Silent Emergency Mode:\s*OFF/i)).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Silent Emergency Mode:\s*ON/i)).toBeInTheDocument();
  });
});
