import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  /**
   * Current room snapshot returned by the server:
   * { id, hostUid, status, participants: [{ uid, joinedAt }], createdAt, endedAt }
   */
  currentRoom: null,
  /** Loading flag while room creation is pending */
  isCreating: false,
  /** Loading flag while join room is pending */
  isJoining: false,
  /** Error message from validation, server, or socket */
  error: null,
  /** User-facing success feedback message */
  successMessage: null,
  /** Live Socket.IO connection status */
  socketConnected: false,
  /** Socket connection or handshake error */
  socketError: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setSocketConnected(state, action) {
      state.socketConnected = action.payload;
      if (action.payload) {
        state.socketError = null;
      }
    },
    setSocketError(state, action) {
      state.socketError = action.payload;
    },
    createRoomStart(state) {
      state.isCreating = true;
      state.error = null;
      state.successMessage = null;
    },
    createRoomSuccess(state, action) {
      state.isCreating = false;
      state.currentRoom = action.payload;
      state.error = null;
      state.successMessage = 'Room created successfully! Share the Room ID with your peer.';
    },
    createRoomFailure(state, action) {
      state.isCreating = false;
      state.error = action.payload;
    },
    joinRoomStart(state) {
      state.isJoining = true;
      state.error = null;
      state.successMessage = null;
    },
    joinRoomSuccess(state, action) {
      state.isJoining = false;
      state.currentRoom = action.payload;
      state.error = null;
      state.successMessage = 'Joined room successfully!';
    },
    joinRoomFailure(state, action) {
      state.isJoining = false;
      state.error = action.payload;
    },
    peerJoined(state, action) {
      if (state.currentRoom) {
        state.currentRoom = action.payload.room;
        state.successMessage = 'Peer connected to the room!';
      }
    },
    peerLeft(state, action) {
      if (state.currentRoom && state.currentRoom.id === action.payload.roomId) {
        state.currentRoom.participants = state.currentRoom.participants.filter(
          (p) => p.uid !== action.payload.uid,
        );
        state.currentRoom.status = 'waiting';
        state.successMessage = 'Peer has left the room.';
      }
    },
    roomEnded(state, action) {
      if (state.currentRoom && state.currentRoom.id === action.payload.roomId) {
        state.currentRoom = null;
        state.error = 'The room session has ended.';
        state.successMessage = null;
      }
    },
    leaveRoomAction(state) {
      state.currentRoom = null;
      state.isCreating = false;
      state.isJoining = false;
      state.error = null;
      state.successMessage = null;
    },
    clearRoomError(state) {
      state.error = null;
    },
    clearRoomSuccess(state) {
      state.successMessage = null;
    },
    resetRoomState() {
      return initialState;
    },
  },
});

export const {
  setSocketConnected,
  setSocketError,
  createRoomStart,
  createRoomSuccess,
  createRoomFailure,
  joinRoomStart,
  joinRoomSuccess,
  joinRoomFailure,
  peerJoined,
  peerLeft,
  roomEnded,
  leaveRoomAction,
  clearRoomError,
  clearRoomSuccess,
  resetRoomState,
} = roomSlice.actions;

export default roomSlice.reducer;
