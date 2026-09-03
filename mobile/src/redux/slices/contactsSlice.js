import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contactsApi } from '../../api/contactsApi';

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async (_, { rejectWithValue }) => {
  try {
    const data = await contactsApi.getContacts();
    return data.contacts || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch contacts');
  }
});

export const addContact = createAsyncThunk('contacts/addContact', async (payload, { rejectWithValue }) => {
  try {
    const data = await contactsApi.addContact(payload);
    return data.contact || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to add contact');
  }
});

export const updateContact = createAsyncThunk('contacts/updateContact', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const data = await contactsApi.updateContact(id, payload);
    return data.contact || data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to update contact');
  }
});

export const deleteContact = createAsyncThunk('contacts/deleteContact', async (id, { rejectWithValue }) => {
  try {
    await contactsApi.deleteContact(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete contact');
  }
});

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    contacts: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.contacts.push(action.payload);
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        const idx = state.contacts.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.contacts[idx] = action.payload;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter(c => String(c.id) !== String(action.payload));
      });
  },
});

export default contactsSlice.reducer;
