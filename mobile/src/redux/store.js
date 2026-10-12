import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sosReducer from './slices/sosSlice';
import contactsReducer from './slices/contactsSlice';
import locationReducer from './slices/locationSlice';
import emergencyEmailsReducer from './slices/emergencyEmailsSlice';

const appReducer = combineReducers({
  auth: authReducer,
  sos: sosReducer,
  contacts: contactsReducer,
  location: locationReducer,
  emergencyEmails: emergencyEmailsReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout' || action.type === 'auth/logoutUser/fulfilled') {
    // Completely reset all Redux state upon logout to prevent data leaks (matching client store)
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});
