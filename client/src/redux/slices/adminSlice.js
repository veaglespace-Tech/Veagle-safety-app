import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminApi } from '../api/adminApi.js';

export const fetchAdminOverview = createAsyncThunk(
  'admin/fetchAdminOverview',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminApi.fetchOverview();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch admin overview');
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchAdminUsers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminApi.fetchUsers();
      return data.users || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch users list');
    }
  }
);

export const updateGstRate = createAsyncThunk(
  'admin/updateGstRate',
  async (gstPercentage, { rejectWithValue }) => {
    try {
      const data = await adminApi.updateGstSettings(gstPercentage);
      return data.gstPercentage;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update GST percentage');
    }
  }
);

export const fetchAdminPayments = createAsyncThunk(
  'admin/fetchAdminPayments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminApi.fetchPaymentHistory();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch payments');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    overview: null,
    users: [],
    paymentsSummary: null,
    paymentsList: [],
    gstPercentage: 18.0,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.overview = action.payload;
        if (action.payload?.metrics?.currentGstPercentage !== undefined && action.payload?.metrics?.currentGstPercentage !== null) {
          state.gstPercentage = action.payload.metrics.currentGstPercentage;
        }
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(updateGstRate.fulfilled, (state, action) => {
        state.gstPercentage = action.payload;
      })
      .addCase(fetchAdminPayments.fulfilled, (state, action) => {
        state.paymentsSummary = action.payload.summary;
        state.paymentsList = action.payload.payments;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
