import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { emergencyEmailsApi } from '../../api/emergencyEmailsApi';

export const fetchEmergencyEmails = createAsyncThunk(
  'emergencyEmails/fetchEmails',
  async (_, { rejectWithValue }) => {
    try {
      const data = await emergencyEmailsApi.getEmails();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch emergency emails');
    }
  }
);

export const addEmergencyEmail = createAsyncThunk(
  'emergencyEmails/addEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await emergencyEmailsApi.addEmail(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to add emergency email');
    }
  }
);

export const deleteEmergencyEmail = createAsyncThunk(
  'emergencyEmails/deleteEmail',
  async (id, { rejectWithValue }) => {
    try {
      await emergencyEmailsApi.deleteEmail(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete emergency email');
    }
  }
);

const emergencyEmailsSlice = createSlice({
  name: 'emergencyEmails',
  initialState: {
    emails: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearEmergencyEmailsError: (state) => {
      state.error = null;
    },
    // Optimistic UI toggle for active status since there's no backend PUT route defined in server
    toggleEmailActiveStatus: (state, action) => {
      const email = state.emails.find(e => e.id === action.payload);
      if (email) {
        email.active = !email.active;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchEmergencyEmails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyEmails.fulfilled, (state, action) => {
        state.isLoading = false;
        // Assume API returns data wrapped in standard format
        state.emails = action.payload.data || action.payload || [];
      })
      .addCase(fetchEmergencyEmails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add
      .addCase(addEmergencyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addEmergencyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        // Append newly added email
        const newEmail = action.payload.data || action.payload;
        if (newEmail) {
          state.emails.unshift(newEmail);
        }
      })
      .addCase(addEmergencyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete
      .addCase(deleteEmergencyEmail.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteEmergencyEmail.fulfilled, (state, action) => {
        state.emails = state.emails.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteEmergencyEmail.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearEmergencyEmailsError, toggleEmailActiveStatus } = emergencyEmailsSlice.actions;
export default emergencyEmailsSlice.reducer;
