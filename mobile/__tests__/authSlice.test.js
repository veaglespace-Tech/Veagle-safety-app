import authReducer, {
  clearAuthMessages,
  setShowOtpModal,
  setToken,
  clearAuth,
} from '../src/redux/slices/authSlice';

describe('Auth Redux Slice Unit Tests', () => {
  const initialState = {
    user: null,
    token: null,
    registrationToken: null,
    pendingToken: null,
    pendingVerificationEmail: null,
    isLoading: false,
    error: null,
    successMessage: null,
    showOtpModal: false,
  };

  it('should return initial state by default', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearAuthMessages', () => {
    const prevState = { ...initialState, error: 'Login failed', successMessage: 'Success' };
    const nextState = authReducer(prevState, clearAuthMessages());
    expect(nextState.error).toBeNull();
    expect(nextState.successMessage).toBeNull();
  });

  it('should handle setShowOtpModal', () => {
    const nextState = authReducer(initialState, setShowOtpModal(true));
    expect(nextState.showOtpModal).toBe(true);
  });

  it('should handle setToken', () => {
    const testToken = 'jwt_test_token_123';
    const nextState = authReducer(initialState, setToken(testToken));
    expect(nextState.token).toBe(testToken);
  });

  it('should handle clearAuth', () => {
    const loggedInState = {
      ...initialState,
      user: { fullName: 'Priya Sharma', email: 'priya@test.com' },
      token: 'valid_token',
      registrationToken: 'reg_token',
    };
    const nextState = authReducer(loggedInState, clearAuth());
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.registrationToken).toBeNull();
  });
});
