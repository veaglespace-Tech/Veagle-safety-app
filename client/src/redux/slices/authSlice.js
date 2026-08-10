import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi.js';

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('tichi_token') : null;
const initialRegToken = typeof window !== 'undefined' ? localStorage.getItem('tichi_reg_token') : null;
const initialPendingToken = typeof window !== 'undefined' ? localStorage.getItem('tichi_pending_token') : null;

const initialUser = typeof window !== 'undefined' ? (() => {
  try {
    const item = localStorage.getItem('tichi_user');
    return item ? JSON.parse(item) : null;
  } catch (e) { return null; }
})() : null;

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  if (typeof window !== 'undefined' && !localStorage.getItem('tichi_token')) {
    return rejectWithValue({ status: 401, error: 'No auth token' });
  }
  try {
    const data = await authApi.getProfile();
    return data.user;
  } catch (err) {
    const status = err?.response?.status;
    const errorMsg = err?.response?.data?.error || 'Session expired';
    if (status === 401 || status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tichi_token');
        localStorage.removeItem('tichi_user');
      }
      return rejectWithValue({ status, error: errorMsg });
    }
    return rejectWithValue({ status: status || 500, error: errorMsg, isNetworkError: true });
  }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authApi.login(credentials);
    if (data.token) {
      localStorage.setItem('tichi_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('tichi_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    return rejectWithValue({
      error: err.response?.data?.error || 'Login failed',
      requiresVerification: err.response?.data?.requiresVerification || false,
      email: err.response?.data?.email || credentials?.email,
    });
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (formData, { rejectWithValue }) => {
  try {
    const data = await authApi.register(formData);
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('tichi_token', data.token);
    }
    if (data.user && typeof window !== 'undefined') {
      localStorage.setItem('tichi_user', JSON.stringify(data.user));
    }
    if (data.pendingToken && typeof window !== 'undefined') {
      localStorage.setItem('tichi_pending_token', data.pendingToken);
    }
    return data;
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
    return rejectWithValue(errorMsg);
  }
});

export const verifyEmailOtp = createAsyncThunk('auth/verifyEmailOtp', async ({ email, otp, pendingToken }, { rejectWithValue }) => {
  try {
    const data = await authApi.verifyEmail({ email, otp, pendingToken });
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('tichi_token', data.token);
    }
    if (data.registrationToken && typeof window !== 'undefined') {
      localStorage.setItem('tichi_reg_token', data.registrationToken);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Verification failed');
  }
});

export const resendOtpCode = createAsyncThunk('auth/resendOtpCode', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.resendOtp(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to resend OTP');
  }
});

export const updateProfileSettings = createAsyncThunk('auth/updateProfileSettings', async (formData, { rejectWithValue }) => {
  try {
    const data = await authApi.updateSettings(formData);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: initialToken,
    user: initialUser,
    registrationToken: initialRegToken,
    pendingToken: initialPendingToken,
    isLoading: false,
    error: null,
    successMessage: null,
    pendingVerificationEmail: null,
    showOtpModal: false,
  },
  reducers: {
    logout: (state) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tichi_token');
        localStorage.removeItem('tichi_user');
        localStorage.removeItem('tichi_reg_token');
        localStorage.removeItem('tichi_pending_token');
        localStorage.removeItem('token');
      }
      state.token = null;
      state.user = null;
      state.registrationToken = null;
      state.pendingToken = null;
      state.error = null;
      state.pendingVerificationEmail = null;
      state.showOtpModal = false;
    },
    clearAuthMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setShowOtpModal: (state, action) => {
      state.showOtpModal = action.payload;
    },
    setPendingEmail: (state, action) => {
      state.pendingVerificationEmail = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        if (typeof window !== 'undefined' && action.payload) {
          localStorage.setItem('tichi_user', JSON.stringify(action.payload));
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.status === 401 || action.payload?.status === 403) {
          state.token = null;
          state.user = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('tichi_token');
            localStorage.removeItem('tichi_user');
          }
        }
      })

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        if (typeof window !== 'undefined' && action.payload.user) {
          localStorage.setItem('tichi_user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || 'Login failed';
        if (action.payload?.requiresVerification) {
          state.pendingVerificationEmail = action.payload.email;
          state.showOtpModal = true;
        }
      })

      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        if (action.payload.token) state.token = action.payload.token;
        if (action.payload.user) state.user = action.payload.user;
        state.pendingToken = action.payload.pendingToken || state.pendingToken;
        if (action.payload.user && typeof window !== 'undefined') {
          localStorage.setItem('tichi_user', JSON.stringify(action.payload.user));
        }
        if (action.payload.requiresVerification) {
          state.pendingVerificationEmail = action.payload.email;
          state.showOtpModal = true;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(verifyEmailOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token) state.token = action.payload.token;
        if (action.payload.registrationToken) state.registrationToken = action.payload.registrationToken;
        state.user = action.payload.user;
        state.showOtpModal = false;
        state.pendingVerificationEmail = null;
        if (typeof window !== 'undefined' && action.payload.user) {
          localStorage.setItem('tichi_user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(resendOtpCode.fulfilled, (state, action) => {
        state.successMessage = action.payload?.message || 'OTP resent successfully';
        if (action.payload?.pendingToken) {
          state.pendingToken = action.payload.pendingToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem('tichi_pending_token', action.payload.pendingToken);
          }
        }
      })

      .addCase(updateProfileSettings.fulfilled, (state, action) => {
        state.user = action.payload;
        if (typeof window !== 'undefined' && action.payload) {
          localStorage.setItem('tichi_user', JSON.stringify(action.payload));
        }
      });
  },
});

export const { logout, clearAuthMessages, setShowOtpModal, setPendingEmail } = authSlice.actions;
export default authSlice.reducer;
