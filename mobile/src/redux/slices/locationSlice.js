import { createSlice } from '@reduxjs/toolkit';

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    latitude: null,
    longitude: null,
    accuracy: null,
    status: 'OFFLINE', // 'LIVE' | 'STALE' | 'DENIED' | 'OFFLINE'
  },
  reducers: {
    setLocation: (state, action) => {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.accuracy = action.payload.accuracy;
      state.status = 'LIVE';
    },
    setLocationStatus: (state, action) => {
      state.status = action.payload;
    },
    clearLocation: (state) => {
      state.latitude = null;
      state.longitude = null;
      state.accuracy = null;
      state.status = 'OFFLINE';
    },
  },
});

export const { setLocation, setLocationStatus, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;
