import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import sosReducer from './slices/sosSlice.js';
import planReducer from './slices/planSlice.js';
import adminReducer from './slices/adminSlice.js';
import locationReducer from './slices/locationSlice.js';
import contactsReducer from './slices/contactSlice.js';

const appReducer = combineReducers({
  auth: authReducer,
  sos: sosReducer,
  plan: planReducer,
  admin: adminReducer,
  location: locationReducer,
  contacts: contactsReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // Completely reset all state upon logout to prevent data leaks
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
