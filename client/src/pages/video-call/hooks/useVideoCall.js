import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  connectSocket,
  getSocket,
  emitCreateRoom,
  emitJoinRoom,
  emitLeaveRoom,
} from '@/services/socketService';
import { releaseStream } from '@/services/mediaService';
import {
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
} from '@/store/slices/roomSlice';

/**
 * useVideoCall — custom hook managing room orchestration, Socket.IO
 * subscriptions, Redux synchronisation, lobby visibility, and local
 * form/clipboard state.
 *
 * Lobby state
 * ────────────
 * `lobbyActive` is a local boolean flag that goes true once the server confirms
 * room creation or joining. It goes false again when the user cancels (leaves
 * the lobby) or when handleStartCall is called (proceeds to the call).
 *
 * Media lifecycle
 * ────────────────
 * This hook does NOT acquire media. Acquisition is triggered by <PreCallLobby>
 * on mount. Releasing media on cancel is handled here via releaseStream().
 *
 * All business logic lives here so UI components remain purely presentational.
 */
export function useVideoCall() {
  const dispatch = useDispatch();

  // Redux auth state (reused from existing store)
  const user = useSelector((state) => state.auth.user);

  // Redux room state
  const {
    currentRoom,
    isCreating,
    isJoining,
    error,
    successMessage,
    socketConnected,
    socketError,
  } = useSelector((state) => state.room);

  // Local form state
  const [roomId, setRoomId] = useState('');
  const [roomIdError, setRoomIdError] = useState('');
  const [copied, setCopied] = useState(false);

  // Lobby visibility flag — true after a successful room:created / room:joined.
  // Kept local so it doesn't persist across page reloads or Redux rehydration.
  const [lobbyActive, setLobbyActive] = useState(false);

  // In-call visibility flag — true when user transitions from lobby to in-call screen.
  const [inCall, setInCall] = useState(false);

  // Is the current user the host of the active room?
  const isHost = Boolean(
    currentRoom && user && currentRoom.hostUid === user.uid,
  );

  // Is there a peer participant present in the active room?
  const peerPresent = Boolean(
    currentRoom?.participants?.some((p) => p.uid !== user?.uid),
  );

  /**
   * Socket lifecycle & event listener management.
   * Attaches clean listeners when socket connects and cleans them up on unmount.
   */
  useEffect(() => {
    let currentSocket = getSocket();

    const handleRoomCreated = ({ room }) => {
      dispatch(createRoomSuccess(room));
      // Open the lobby after the server confirms the room.
      setLobbyActive(true);
    };

    const handleRoomJoined = ({ room }) => {
      dispatch(joinRoomSuccess(room));
      // Open the lobby after successfully joining.
      setLobbyActive(true);
    };

    const handlePeerJoined = (data) => {
      dispatch(peerJoined(data));
    };

    const handleRoomLeft = (data) => {
      dispatch(peerLeft(data));
    };

    const handleRoomEnded = (data) => {
      dispatch(roomEnded(data));
      // If the room ended while we were in the lobby or call, close them and
      // release media so the user isn't left with a dangling stream.
      setLobbyActive(false);
      setInCall(false);
      releaseStream();
    };

    const handleRoomError = ({ message }) => {
      // Dispatches error to whichever action was pending
      dispatch(createRoomFailure(message));
      dispatch(joinRoomFailure(message));
      // Ensure the lobby and call are not shown on error.
      setLobbyActive(false);
      setInCall(false);
    };

    const handleConnect = () => {
      dispatch(setSocketConnected(true));
    };

    const handleDisconnect = () => {
      dispatch(setSocketConnected(false));
    };

    const handleConnectError = (err) => {
      dispatch(setSocketError(err?.message || 'Socket connection failed.'));
    };

    const attachListeners = (s) => {
      if (!s) return;
      s.off('room:created', handleRoomCreated);
      s.off('room:joined', handleRoomJoined);
      s.off('room:peer-joined', handlePeerJoined);
      s.off('room:left', handleRoomLeft);
      s.off('room:ended', handleRoomEnded);
      s.off('room:error', handleRoomError);
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('connect_error', handleConnectError);

      s.on('room:created', handleRoomCreated);
      s.on('room:joined', handleRoomJoined);
      s.on('room:peer-joined', handlePeerJoined);
      s.on('room:left', handleRoomLeft);
      s.on('room:ended', handleRoomEnded);
      s.on('room:error', handleRoomError);
      s.on('connect', handleConnect);
      s.on('disconnect', handleDisconnect);
      s.on('connect_error', handleConnectError);
    };

    const detachListeners = (s) => {
      if (!s) return;
      s.off('room:created', handleRoomCreated);
      s.off('room:joined', handleRoomJoined);
      s.off('room:peer-joined', handlePeerJoined);
      s.off('room:left', handleRoomLeft);
      s.off('room:ended', handleRoomEnded);
      s.off('room:error', handleRoomError);
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('connect_error', handleConnectError);
    };

    if (user) {
      connectSocket()
        .then((s) => {
          currentSocket = s;
          attachListeners(s);
          dispatch(setSocketConnected(s.connected));
        })
        .catch((err) => {
          // Socket connection failure handled gracefully without creating a room
          console.warn('[useVideoCall] Connection error on mount:', err.message);
          dispatch(setSocketError(err.message));
        });
    }

    return () => {
      if (currentSocket) {
        detachListeners(currentSocket);
      }
    };
  }, [user, dispatch]);

  /** Clear input validation errors as user types */
  const handleRoomIdChange = useCallback(
    (e) => {
      setRoomId(e.target.value);
      if (roomIdError) setRoomIdError('');
      if (error) dispatch(clearRoomError());
    },
    [roomIdError, error, dispatch],
  );

  /**
   * Create a new room.
   *
   * Verifies socket connection first. If connection fails, surfaces error
   * without creating a room or emitting room:create.
   */
  const handleCreateRoom = useCallback(async () => {
    // Prevent duplicate submissions or creating while already hosting/joining
    if (isCreating || isJoining || currentRoom) {
      return;
    }

    dispatch(createRoomStart());

    try {
      const activeSocket = await connectSocket();
      if (!activeSocket?.connected) {
        throw new Error('Real-time connection unavailable. Please check your network.');
      }
      emitCreateRoom();
    } catch (err) {
      console.error('[useVideoCall] handleCreateRoom failed:', err);
      dispatch(
        createRoomFailure(
          err.message || 'Unable to connect to the room server. Please try again.',
        ),
      );
    }
  }, [isCreating, isJoining, currentRoom, dispatch]);

  /**
   * Join an existing room with validation and error protection.
   */
  const handleJoinRoom = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (isJoining || isCreating) {
        return;
      }

      const trimmedId = roomId.trim();
      if (!trimmedId) {
        setRoomIdError('Please enter a Room ID before joining.');
        return;
      }

      setRoomIdError('');
      dispatch(joinRoomStart());

      try {
        const activeSocket = await connectSocket();
        if (!activeSocket?.connected) {
          throw new Error('Real-time connection unavailable. Please check your network.');
        }
        emitJoinRoom(trimmedId);
      } catch (err) {
        console.error('[useVideoCall] handleJoinRoom failed:', err);
        dispatch(
          joinRoomFailure(
            err.message || 'Unable to join the requested room. Please try again.',
          ),
        );
      }
    },
    [roomId, isJoining, isCreating, dispatch],
  );

  /**
   * Leave current active room (used by the home-view cards).
   * Also releases media since leaving from the home view means the session ends.
   */
  const handleLeaveRoom = useCallback(() => {
    try {
      emitLeaveRoom();
    } catch (err) {
      console.warn('[useVideoCall] Error while leaving room:', err.message);
    }
    dispatch(leaveRoomAction());
    setLobbyActive(false);
    setInCall(false);
    releaseStream();
  }, [dispatch]);

  /**
   * User cancelled the pre-call lobby.
   * Emits room:leave, clears Redux state, closes the lobby, and releases media.
   */
  const handleCancelLobby = useCallback(() => {
    try {
      emitLeaveRoom();
    } catch (err) {
      console.warn('[useVideoCall] Error leaving room on lobby cancel:', err.message);
    }
    dispatch(leaveRoomAction());
    setLobbyActive(false);
    setInCall(false);
    releaseStream();
  }, [dispatch]);

  /**
   * User clicked "Start Call" / "Join Call" in the lobby.
   * Closes the lobby and proceeds to the in-call screen.
   *
   * The MediaStream is preserved in mediaService and reused by InCallScreen / useWebRTC.
   */
  const handleStartCall = useCallback(() => {
    setLobbyActive(false);
    setInCall(true);
    console.log('[useVideoCall] Starting call — transitioning to in-call screen.');
  }, []);

  /**
   * User clicked "End Call" in the in-call screen.
   * Emits room:leave, clears Redux state, closes the call screen, and releases media.
   */
  const handleEndCall = useCallback(() => {
    try {
      emitLeaveRoom();
    } catch (err) {
      console.warn('[useVideoCall] Error while leaving room on end call:', err.message);
    }
    dispatch(leaveRoomAction());
    setLobbyActive(false);
    setInCall(false);
    releaseStream();
  }, [dispatch]);

  /**
   * Copy Room ID to clipboard with browser fallback and visual feedback.
   */
  const handleCopyRoomId = useCallback(
    async (idToCopy) => {
      const text = idToCopy || currentRoom?.id;
      if (!text) return;

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('[useVideoCall] Failed to copy room ID:', err);
      }
    },
    [currentRoom?.id],
  );

  const handleDismissError = useCallback(() => {
    dispatch(clearRoomError());
  }, [dispatch]);

  const handleDismissSuccess = useCallback(() => {
    dispatch(clearRoomSuccess());
  }, [dispatch]);

  return {
    user,
    currentRoom,
    isHost,
    roomId,
    roomIdError,
    isCreating,
    isJoining,
    error,
    successMessage,
    socketConnected,
    socketError,
    copied,
    lobbyActive,
    inCall,
    peerPresent,
    handleRoomIdChange,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyRoomId,
    handleDismissError,
    handleDismissSuccess,
    handleStartCall,
    handleCancelLobby,
    handleEndCall,
  };
}
