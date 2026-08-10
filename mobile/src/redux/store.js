import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sosReducer from './slices/sosSlice';
import contactsReducer from './slices/contactsSlice';
import locationReducer from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sos: sosReducer,
    contacts: contactsReducer,
    location: locationReducer,
  },
});
