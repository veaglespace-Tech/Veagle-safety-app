import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../../api/authApi';
import { TOKEN_KEY } from '../../utils/constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Centralised role strings — never hardcode these across the app */
export const ROLES = {
  USER:        'USER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORGANIZATION: 'ORGANIZATION',
  PARENT:      'PARENT',
};

/** Subscription statuses that allow mobile access */
const ACTIVE_SUBSCRIPTION = 'ACTIVE';

/** Contact number shown in subscription-expired messages */
const SUPPORT_NUMBER = '8237999101';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the backend error indicates that this account must use
 * the dedicated super-admin login path (isAdminLogin: true).
 */
const isSuperAdminError = (errorMsg = '') => {
  const msg = errorMsg.toLowerCase();
  return (
    msg.includes('superadmin') ||
    msg.includes('super_admin') ||
    msg.includes('admin login')
  );
};

/**
 * Returns the normalised role string for a user object.
 * Falls back to ROLES.USER if the role field is missing.
 */
const getUserRole = (user) => user?.role?.toUpperCase() || ROLES.USER;

/**
 * Extracts the most useful error message from an Axios error object.
 */
const extractApiError = (err, fallback = 'Something went wrong. Please try again.') =>
  err.response?.data?.error ||
  err.response?.data?.message ||
  fallback;

// ---------------------------------------------------------------------------
// Async Thunks
// ---------------------------------------------------------------------------

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.register(payload);
      return data;
    } catch (err) {
      return rejectWithValue({
        error: extractApiError(err, 'Registration failed'),
        requiresVerification: err.response?.data?.requiresVerification ?? false,
        email: err.response?.data?.email || payload?.email,
      });
    }
  },
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.login(payload);

      // Guard: block regular users without an active subscription
      if (data.user) {
        const role = getUserRole(data.user);
        const hasActiveSubscription = data.user.subscriptionStatus === ACTIVE_SUBSCRIPTION;

        if (role === ROLES.USER && !hasActiveSubscription) {
          return rejectWithValue({
            error: `Your account does not have an active subscription. Contact ${SUPPORT_NUMBER} to upgrade your plan.`,
          });
        }
      }

      // Persist token to local storage on successful login
      if (data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }

      return data;
    } catch (err) {
      return rejectWithValue({
        error: extractApiError(err, 'Login failed'),
        requiresVerification: err.response?.data?.requiresVerification ?? false,
        email: err.response?.data?.email || payload?.email,
      });
    }
  },
);

export const verifyEmailOtp = createAsyncThunk(
  'auth/verifyEmailOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyEmail(payload);
      if (data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }
      return data;
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'OTP verification failed'));
    }
  },
);

export const resendOtpCode = createAsyncThunk(
  'auth/resendOtpCode',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.resendOtp(payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'Could not resend OTP'));
    }
  },
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const data = await authApi.getProfile();
      const userObj = data.user || data;

      // Auto-logout if a regular user's subscription has lapsed since last login
      const role = getUserRole(userObj);
      const hasActiveSubscription = userObj?.subscriptionStatus === ACTIVE_SUBSCRIPTION;

      if (role === ROLES.USER && !hasActiveSubscription) {
        dispatch(logoutUser());
        return rejectWithValue(
          `Your subscription has expired. Please contact ${SUPPORT_NUMBER} to renew your plan.`,
        );
      }

      return data;
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'Failed to fetch profile'));
    }
  },
);

export const updateProfileSettings = createAsyncThunk(
  'auth/updateProfileSettings',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.updateSettings(payload);
      return data;
    } catch (err) {
      return rejectWithValue(extractApiError(err, 'Profile update failed'));
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    try {
      await authApi.logout();
    } catch {
      // Always proceed with local logout even if the API call fails
    }
    // Remove persisted token — the fulfilled handler resets Redux state
    await AsyncStorage.removeItem(TOKEN_KEY);
    return null;
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  user:                     null,
  token:                    null,
  registrationToken:        null,
  pendingToken:             null,
  pendingVerificationEmail: null,
  isLoading:                false,
  isBootstrapping:          true,   // true until the stored-token check completes
  error:                    null,
  successMessage:           null,
  showOtpModal:             false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Clear transient error / success banners without touching auth state */
    clearAuthMessages: (state) => {
      state.error          = null;
      state.successMessage = null;
    },

    setShowOtpModal: (state, action) => {
      state.showOtpModal = action.payload;
    },

    /** Used by AppNavigator on boot to hydrate the token from AsyncStorage */
    setToken: (state, action) => {
      state.token = action.payload;
    },

    /** Full reset — called by logoutUser after the API call */
    clearAuth: () => ({ ...initialState, isBootstrapping: false }),

    /** Fired by AppNavigator once the stored-token check has finished */
    bootstrapComplete: (state) => {
      state.isBootstrapping = false;
    },
  },

  extraReducers: (builder) => {
    builder

      // ── Register ──────────────────────────────────────────────────────────
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading              = false;
        state.pendingVerificationEmail = action.payload.email || action.meta.arg.email;
        state.showOtpModal           = true;
        state.successMessage         = action.payload.message || 'OTP sent to your email!';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.error || 'Registration failed';
        if (action.payload?.requiresVerification) {
          state.pendingVerificationEmail = action.payload.email;
          state.showOtpModal             = true;
        }
      })

      // ── Login ─────────────────────────────────────────────────────────────
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error     = null;

        if (action.payload.requiresVerification || action.payload.pendingToken) {
          state.pendingToken             = action.payload.pendingToken;
          state.pendingVerificationEmail = action.payload.email || action.meta.arg.email;
          state.showOtpModal             = true;
          return;
        }

        state.token = action.payload.token;
        state.user  = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;

        // Suppress the super-admin redirect error — LoginScreen handles the retry silently
        const errMsg = action.payload?.error || '';
        state.error  = isSuperAdminError(errMsg) ? null : errMsg || 'Login failed';

        if (action.payload?.requiresVerification) {
          state.pendingVerificationEmail = action.payload.email;
          state.showOtpModal             = true;
        }
      })

      // ── Verify OTP ────────────────────────────────────────────────────────
      .addCase(verifyEmailOtp.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.isLoading    = false;
        state.showOtpModal = false;

        if (action.payload.token) {
          state.token = action.payload.token;
          state.user  = action.payload.user;
        }
        if (action.payload.registrationToken) {
          state.registrationToken = action.payload.registrationToken;
        }
        state.successMessage = 'Email verified successfully!';
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // ── Fetch User ────────────────────────────────────────────────────────
      .addCase(fetchUser.pending, (state) => {
        // Avoid flickering the UI — don't reset user while re-fetching
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── Update Profile ────────────────────────────────────────────────────
      .addCase(updateProfileSettings.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(updateProfileSettings.fulfilled, (state, action) => {
        state.isLoading      = false;
        state.user           = action.payload.user || state.user;
        state.successMessage = 'Profile updated!';
      })
      .addCase(updateProfileSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // ── Logout ────────────────────────────────────────────────────────────
      // isBootstrapping MUST be false so AppNavigator routes to AuthNavigator
      // (Login screen) and not the SplashScreen.
      .addCase(logoutUser.fulfilled, () => ({ ...initialState, isBootstrapping: false }));
  },
});

export const { clearAuthMessages, setShowOtpModal, setToken, clearAuth, bootstrapComplete } = authSlice.actions;
export { isSuperAdminError }; // exported for use in LoginScreen
export default authSlice.reducer;
