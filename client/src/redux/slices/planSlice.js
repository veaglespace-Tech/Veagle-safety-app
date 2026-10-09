import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api.js';

const SINGLE_YEARLY_PLAN = {
  id: 'plan_yearly_24',
  name: 'Sakhi Suraksha 365 Yearly Protection Plan',
  description:
    'Complete 365-Day 24/7 Unlimited SOS Emergency Broadcast, Live GPS Map Sharing, 5 Trusted Contacts Network, and Command Dispatch',
  basePrice: 24,
  gstPercentage: 18,
  totalPrice: 28.32,
  durationDays: 365,
};

export const fetchPlans = createAsyncThunk('plan/fetchPlans', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/plans');
    if (res.data.plans && res.data.plans.length > 0) {
      return res.data.plans;
    }
    return [SINGLE_YEARLY_PLAN];
  } catch (err) {
    return [SINGLE_YEARLY_PLAN];
  }
});

export const initiatePayUCheckout = createAsyncThunk(
  'plan/initiatePayUCheckout',
  async ({ planId, amount }, { rejectWithValue }) => {
    try {
      const res = await api.post('/payment/payu-initiate', { planId, amount });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Payment initiation failed');
    }
  }
);

const planSlice = createSlice({
  name: 'plan',
  initialState: {
    plans: [SINGLE_YEARLY_PLAN],
    selectedPlan: SINGLE_YEARLY_PLAN,
    isLoading: false,
    paymentData: null,
    error: null,
  },
  reducers: {
    setSelectedPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload.length > 0 ? action.payload : [SINGLE_YEARLY_PLAN];
      })
      .addCase(fetchPlans.rejected, (state) => {
        state.isLoading = false;
        state.plans = [SINGLE_YEARLY_PLAN];
      })

      .addCase(initiatePayUCheckout.fulfilled, (state, action) => {
        state.paymentData = action.payload;
      });
  },
});

export const { setSelectedPlan } = planSlice.actions;
export default planSlice.reducer;
