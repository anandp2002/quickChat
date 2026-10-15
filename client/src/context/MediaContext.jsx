/**
 * MediaContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * React Context that bridges the module-level mediaService singleton into the
 * React component tree.
 *
 * Why a context instead of direct service calls in components?
 * ─────────────────────────────────────────────────────────────
 * • Components need to re-render when the stream changes (e.g. after the
 *   permission prompt resolves). The service uses subscription callbacks to
 *   notify the context, which then propagates updates via React state.
 * • Keeps UI components clean: they consume `useMedia()` rather than
 *   importing service functions directly.
 * • Makes testing straightforward — swap the context value in tests.
 *
 * What this context provides
 * ──────────────────────────
 * • stream         — the current MediaStream (null if not yet acquired)
 * • videoEnabled   — whether the video track is currently enabled
 * • audioEnabled   — whether the audio track is currently enabled
 * • isAcquiring    — true while the getUserMedia prompt is pending
 * • mediaError     — descriptive error string if acquisition failed
 * • hasCamera      — true if the stream has at least one video track
 * • hasMicrophone  — true if the stream has at least one audio track
 * • acquire()      — request media (idempotent)
 * • release()      — stop tracks and clear stream
 * • toggleVideo()  — flip the camera on/off
 * • toggleAudio()  — flip the microphone on/off
 * • retryAcquire() — release then re-acquire (for "Try Again" buttons)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  acquireStream,
  getStream,
  onStreamChange,
  releaseStream,
  setAudioEnabled,
  setVideoEnabled,
} from '@/services/mediaService';

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import('react').Context<MediaContextValue | null>} */
const MediaContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrap the subtree that needs media access with this provider.
 * Mount it once high in the tree (e.g. around the protected routes).
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function MediaProvider({ children }) {
  const [stream, setStream] = useState(() => getStream());
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [mediaError, setMediaError] = useState(/** @type {string | null} */ (null));
  const [videoEnabled, setVideoEnabledState] = useState(true);
  const [audioEnabled, setAudioEnabledState] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);

  // Track whether this provider instance is still mounted.
  // Prevents state updates after unmount (though providers rarely unmount).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Subscribe to service-level stream changes (e.g. released externally).
  useEffect(() => {
    const unsubscribe = onStreamChange((newStream) => {
      if (!mountedRef.current) return;
      setStream(newStream);
      if (!newStream) {
        setHasCamera(false);
        setHasMicrophone(false);
        setVideoEnabledState(true);
        setAudioEnabledState(true);
      }
    });
    return unsubscribe;
  }, []);

  /**
   * Request media access. Idempotent — safe to call from multiple places.
   * Does NOT release existing stream first.
   */
  const acquire = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsAcquiring(true);
    setMediaError(null);

    try {
      const { stream: s, videoEnabled: ve, audioEnabled: ae } = await acquireStream();

      if (!mountedRef.current) return;

      setStream(s);
      setHasCamera(ve);
      setHasMicrophone(ae);
      // Preserve any previously toggled state on the live tracks.
      setVideoEnabledState(
        s.getVideoTracks().length > 0 ? (s.getVideoTracks()[0]?.enabled ?? true) : false,
      );
      setAudioEnabledState(
        s.getAudioTracks().length > 0 ? (s.getAudioTracks()[0]?.enabled ?? true) : false,
      );
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[MediaContext] acquire failed:', err);
      setMediaError(err.message || 'Unable to access camera or microphone.');
    } finally {
      if (mountedRef.current) {
        setIsAcquiring(false);
      }
    }
  }, []);

  /**
   * Stop all tracks and clear the stream.
   * Call this on session cancel or call end — not on lobby→call navigation.
   */
  const release = useCallback(() => {
    releaseStream();
    // onStreamChange subscription will update React state.
  }, []);

  /**
   * Flip the camera on/off and update UI state.
   */
  const toggleVideo = useCallback(() => {
    setVideoEnabledState((prev) => {
      const next = !prev;
      setVideoEnabled(next);
      return next;
    });
  }, []);

  /**
   * Flip the microphone on/off and update UI state.
   */
  const toggleAudio = useCallback(() => {
    setAudioEnabledState((prev) => {
      const next = !prev;
      setAudioEnabled(next);
      return next;
    });
  }, []);

  /**
   * Release the current stream then re-acquire.
   * For "Try Again" / retry flows.
   */
  const retryAcquire = useCallback(async () => {
    releaseStream();
    await acquire();
  }, [acquire]);

  const value = {
    stream,
    isAcquiring,
    mediaError,
    videoEnabled,
    audioEnabled,
    hasCamera,
    hasMicrophone,
    acquire,
    release,
    toggleVideo,
    toggleAudio,
    retryAcquire,
  };

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Consume the MediaContext.
 *
 * Must be used inside a <MediaProvider>.
 *
 * @returns {MediaContextValue}
 */
export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) {
    throw new Error('useMedia must be used within a <MediaProvider>');
  }
  return ctx;
}
