import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../../api/authApi';
import { TOKEN_KEY } from '../../utils/constants';

// Thunks — matching web app's authSlice exactly
export const registerUser = createAsyncThunk('auth/registerUser', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.register(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.login(payload);
    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const verifyEmailOtp = createAsyncThunk('auth/verifyEmailOtp', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.verifyEmail(payload);
    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'OTP verification failed');
  }
});

export const resendOtpCode = createAsyncThunk('auth/resendOtpCode', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.resendOtp(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Could not resend OTP');
  }
});

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.getProfile();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile');
  }
});

export const updateProfileSettings = createAsyncThunk('auth/updateProfileSettings', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.updateSettings(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Update failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  try {
    await authApi.logout();
  } catch (e) {}
  await AsyncStorage.removeItem(TOKEN_KEY);
  dispatch(clearAuth());
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    registrationToken: null,
    pendingToken: null,
    pendingVerificationEmail: null,
    isLoading: false,
    error: null,
    successMessage: null,
    showOtpModal: false,
  },
  reducers: {
    clearAuthMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setShowOtpModal: (state, action) => {
      state.showOtpModal = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.registrationToken = null;
      state.pendingToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingVerificationEmail = action.payload.email || action.meta.arg.email;
        state.showOtpModal = true;
        state.successMessage = action.payload.message || 'OTP sent to your email!';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresVerification || action.payload.pendingToken) {
          state.pendingToken = action.payload.pendingToken;
          state.pendingVerificationEmail = action.meta.arg.email;
          state.showOtpModal = true;
        } else {
          state.token = action.payload.token;
          state.user = action.payload.user;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Verify OTP
      .addCase(verifyEmailOtp.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showOtpModal = false;
        if (action.payload.token) {
          state.token = action.payload.token;
          state.user = action.payload.user;
        }
        if (action.payload.registrationToken) {
          state.registrationToken = action.payload.registrationToken;
        }
        state.successMessage = 'Email verified successfully!';
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch User
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
      })

      // Update Profile
      .addCase(updateProfileSettings.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateProfileSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || state.user;
        state.successMessage = 'Profile updated!';
      })
      .addCase(updateProfileSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.registrationToken = null;
      });
  },
});

export const { clearAuthMessages, setShowOtpModal, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
