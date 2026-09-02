import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sosReducer from './slices/sosSlice';
import contactsReducer from './slices/contactsSlice';
import locationReducer from './slices/locationSlice';
import emergencyEmailsReducer from './slices/emergencyEmailsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sos: sosReducer,
    contacts: contactsReducer,
    location: locationReducer,
    emergencyEmails: emergencyEmailsReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
