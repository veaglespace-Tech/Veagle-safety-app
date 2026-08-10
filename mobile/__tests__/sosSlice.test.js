import sosReducer, {
  clearSosState,
  toggleAlarm,
  setAlarmState,
} from '../src/redux/slices/sosSlice';

describe('SOS Redux Slice Unit Tests', () => {
  const initialState = {
    activeSession: null,
    isTriggering: false,
    isResolving: false,
    isAlarmPlaying: false,
    error: null,
  };

  it('should return initial state by default', () => {
    expect(sosReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle toggleAlarm', () => {
    const nextState = sosReducer(initialState, toggleAlarm());
    expect(nextState.isAlarmPlaying).toBe(true);
    const toggleBack = sosReducer(nextState, toggleAlarm());
    expect(toggleBack.isAlarmPlaying).toBe(false);
  });

  it('should handle setAlarmState', () => {
    const nextState = sosReducer(initialState, setAlarmState(true));
    expect(nextState.isAlarmPlaying).toBe(true);
  });

  it('should handle clearSosState', () => {
    const activeSosState = {
      ...initialState,
      activeSession: { id: 'sos_123', startedAt: new Date().toISOString() },
      isTriggering: true,
      error: 'Alert error',
    };
    const nextState = sosReducer(activeSosState, clearSosState());
    expect(nextState.activeSession).toBeNull();
    expect(nextState.isTriggering).toBe(false);
    expect(nextState.error).toBeNull();
  });
});
