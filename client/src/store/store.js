import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import roomReducer from '@/store/slices/roomSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    room: roomReducer,
  },
});

