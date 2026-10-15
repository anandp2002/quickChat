import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * useVideoCall — custom hook for the Video Call page.
 *
 * Owns all state and event handlers so every child component
 * receives plain values and callbacks — no Redux or business
 * logic leaks into the UI layer.
 *
 * Responsibilities:
 *   • Read the current authenticated user from Redux.
 *   • Manage the "join room" form field and its validation state.
 *   • Expose placeholder handlers that will be replaced with
 *     real Socket.IO calls in Step 2.
 *
 * @returns {{
 *   user: object|null,
 *   roomId: string,
 *   roomIdError: string,
 *   handleRoomIdChange: function,
 *   handleCreateRoom: function,
 *   handleJoinRoom: function,
 * }}
 */
export function useVideoCall() {
  const user = useSelector((state) => state.auth.user);

  const [roomId, setRoomId] = useState('');
  const [roomIdError, setRoomIdError] = useState('');

  /** Clear the error the moment the user starts correcting their input. */
  const handleRoomIdChange = useCallback(
    (e) => {
      setRoomId(e.target.value);
      if (roomIdError) setRoomIdError('');
    },
    [roomIdError],
  );

  /**
   * Placeholder: initiate room creation.
   * TODO (Step 2): emit Socket.IO "create-room" and navigate to the call view.
   */
  const handleCreateRoom = useCallback(() => {
    console.log('[VideoCall] Create room — uid:', user?.uid);
  }, [user?.uid]);

  /**
   * Placeholder: validate and join an existing room.
   * TODO (Step 2): emit Socket.IO "join-room" and navigate to the call view.
   */
  const handleJoinRoom = useCallback(
    (e) => {
      e.preventDefault();
      if (!roomId.trim()) {
        setRoomIdError('Please enter a Room ID before joining.');
        return;
      }
      setRoomIdError('');
      console.log('[VideoCall] Join room:', roomId.trim(), '— uid:', user?.uid);
    },
    [roomId, user?.uid],
  );

  return {
    user,
    roomId,
    roomIdError,
    handleRoomIdChange,
    handleCreateRoom,
    handleJoinRoom,
  };
}
