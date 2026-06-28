import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  /** Serializable user object (NOT the raw Firebase User) */
  user: null,
  /** True until the first onAuthStateChanged callback fires */
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
