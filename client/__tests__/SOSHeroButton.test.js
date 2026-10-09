import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SOSHeroButton } from '../../src/components/sos/SOSHeroButton.js';
import * as sosSlice from '../../src/redux/slices/sosSlice.js';
import * as locationSlice from '../../src/redux/slices/locationSlice.js';

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
    // Initial state before an emergency
    store = createTestStore({
      sos: {
        isActive: false,
        status: 'IDLE',
      },
      location: {
        trackingActive: false,
      },
    });

    // Mock the dispatch function
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

    const buttonElement = screen.getByRole('button', { name: /LONG PRESS FOR EMERGENCY/i });
    expect(buttonElement).toBeInTheDocument();
    expect(screen.getByText('LONG PRESS FOR EMERGENCY')).toBeInTheDocument();
  });

  it('shows loading spinner when SOS trigger is in progress', () => {
    const loadingStore = createTestStore({
      sos: { isActive: false, status: 'LOADING' },
      location: { trackingActive: false }
    });

    render(
      <Provider store={loadingStore}>
        <SOSHeroButton />
      </Provider>
    );

    // The button text should change when loading
    expect(screen.getByText('ACTIVATING...')).toBeInTheDocument();
  });

  it('triggers emergency action on long press (mousedown followed by mouseup after delay)', async () => {
    // We need to mock timers to simulate a 1-second long press
    jest.useFakeTimers();
    
    // Spy on the trigger action
    const triggerSpy = jest.spyOn(sosSlice, 'triggerEmergencySos').mockReturnValue({ type: 'sos/trigger' });

    render(
      <Provider store={store}>
        <SOSHeroButton />
      </Provider>
    );

    const button = screen.getByRole('button');

    // Simulate mouse down
    fireEvent.mouseDown(button);

    // Fast-forward time by 1.1 seconds (threshold is usually 1s)
    jest.advanceTimersByTime(1100);

    // Wait for the action to be dispatched
    await waitFor(() => {
      expect(triggerSpy).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'sos/trigger' });
    });

    jest.useRealTimers();
  });
});
