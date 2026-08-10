import contactsReducer, {
  fetchContacts,
  addContact,
  deleteContact,
} from '../src/redux/slices/contactsSlice';

describe('Contacts Redux Slice Unit Tests', () => {
  const initialState = {
    contacts: [],
    isLoading: false,
    error: null,
  };

  it('should return initial state by default', () => {
    expect(contactsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle fetchContacts.fulfilled', () => {
    const mockContacts = [
      { id: 'c1', name: 'Rohan Sharma', phone: '+919876543210', relationship: 'Brother' },
      { id: 'c2', name: 'Ananya Verma', phone: '+919876500000', relationship: 'Sister' },
    ];
    const action = { type: fetchContacts.fulfilled.type, payload: mockContacts };
    const nextState = contactsReducer(initialState, action);
    expect(nextState.contacts).toHaveLength(2);
    expect(nextState.contacts[0].name).toBe('Rohan Sharma');
    expect(nextState.isLoading).toBe(false);
  });

  it('should handle addContact.fulfilled', () => {
    const newContact = { id: 'c3', name: 'Parent', phone: '+919999988888', relationship: 'Mother' };
    const action = { type: addContact.fulfilled.type, payload: newContact };
    const nextState = contactsReducer(initialState, action);
    expect(nextState.contacts).toHaveLength(1);
    expect(nextState.contacts[0]).toEqual(newContact);
  });

  it('should handle deleteContact.fulfilled', () => {
    const existingState = {
      ...initialState,
      contacts: [
        { id: 'c1', name: 'Contact 1' },
        { id: 'c2', name: 'Contact 2' },
      ],
    };
    const action = { type: deleteContact.fulfilled.type, payload: 'c1' };
    const nextState = contactsReducer(existingState, action);
    expect(nextState.contacts).toHaveLength(1);
    expect(nextState.contacts[0].id).toBe('c2');
  });
});
