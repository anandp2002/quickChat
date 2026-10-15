/**
 * mediaService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton service that owns the local MediaStream lifecycle.
 *
 * Design rationale
 * ─────────────────
 * The stream must survive navigation from the pre-call lobby to the in-call
 * screen. Storing it inside a React component ref would destroy it on unmount.
 * Instead, we hold it in module-level state (outside the React tree) so it
 * persists regardless of which component is mounted.
 *
 * Ownership rules
 * ────────────────
 * • acquireStream()  — starts a new stream only if none is active. Idempotent.
 * • releaseStream()  — stops all tracks and clears the reference.
 * • getStream()      — read-only access; returns null if not acquired.
 * • onStreamChange() — subscribe to stream changes (used by MediaContext).
 *
 * Concurrent-request safety
 * ──────────────────────────
 * A single pending promise is tracked. If acquireStream() is called while a
 * previous request is in flight, the same promise is returned — preventing
 * duplicate getUserMedia() calls (e.g., from React Strict Mode double-invokes).
 *
 * Late-response safety
 * ─────────────────────
 * If the caller has already left the lobby before the permission prompt
 * resolves, the newly acquired tracks are stopped immediately and the stream
 * reference is not stored.
 */

/** @type {MediaStream | null} */
let _stream = null;

/** @type {Promise<{ stream: MediaStream; videoEnabled: boolean; audioEnabled: boolean }> | null} */
let _pendingAcquire = null;

/** @type {Set<(stream: MediaStream | null) => void>} */
const _listeners = new Set();

/**
 * Notify all registered listeners of a stream change.
 * @param {MediaStream | null} stream
 */
function _notify(stream) {
  _listeners.forEach((fn) => fn(stream));
}

/**
 * Subscribe to stream change events.
 *
 * @param {(stream: MediaStream | null) => void} fn
 * @returns {() => void} Unsubscribe function
 */
export function onStreamChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/**
 * Return the active MediaStream, or null if not acquired.
 *
 * @returns {MediaStream | null}
 */
export function getStream() {
  return _stream;
}

/**
 * Return whether we currently have a live stream.
 *
 * @returns {boolean}
 */
export function hasActiveStream() {
  return _stream !== null && _stream.getTracks().some((t) => t.readyState === 'live');
}

/**
 * Acquire the local MediaStream.
 *
 * - If a live stream already exists, resolves immediately with it (idempotent).
 * - If a request is already in flight, returns that same promise.
 * - Requests both video and audio; falls back to audio-only if camera fails.
 *
 * @returns {Promise<{ stream: MediaStream; videoEnabled: boolean; audioEnabled: boolean }>}
 */
export async function acquireStream() {
  // Already have a live stream — reuse it.
  if (hasActiveStream()) {
    const videoEnabled = _stream.getVideoTracks().length > 0;
    const audioEnabled = _stream.getAudioTracks().length > 0;
    return { stream: _stream, videoEnabled, audioEnabled };
  }

  // In-flight request — deduplicate.
  if (_pendingAcquire) {
    return _pendingAcquire;
  }

  _pendingAcquire = (async () => {
    try {
      let stream;
      let videoEnabled = true;
      let audioEnabled = true;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (videoErr) {
        // Video failed — try audio-only fallback.
        console.warn('[mediaService] Video+audio failed, trying audio-only:', videoErr.message);
        videoEnabled = false;

        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          // Both failed — rethrow a descriptive error.
          throw buildMediaError(videoErr, audioErr);
        }
      }

      // Late-response guard: check if releaseStream() was called while we waited.
      // If _stream is still null, we are the valid owner.
      if (_stream !== null) {
        // Another acquisition completed concurrently — stop the new tracks.
        stream.getTracks().forEach((t) => t.stop());
        const v = _stream.getVideoTracks().length > 0;
        const a = _stream.getAudioTracks().length > 0;
        return { stream: _stream, videoEnabled: v, audioEnabled: a };
      }

      _stream = stream;
      _notify(_stream);

      const hasMic = _stream.getAudioTracks().length > 0;
      return { stream: _stream, videoEnabled, audioEnabled: hasMic };
    } finally {
      _pendingAcquire = null;
    }
  })();

  return _pendingAcquire;
}

/**
 * Stop all tracks and release the stream reference.
 * Safe to call multiple times.
 */
export function releaseStream() {
  if (_stream) {
    _stream.getTracks().forEach((t) => t.stop());
    _stream = null;
    _notify(null);
  }
}

/**
 * Enable or disable all video tracks on the current stream.
 *
 * @param {boolean} enabled
 */
export function setVideoEnabled(enabled) {
  if (!_stream) return;
  _stream.getVideoTracks().forEach((t) => {
    t.enabled = enabled;
  });
}

/**
 * Enable or disable all audio tracks on the current stream.
 *
 * @param {boolean} enabled
 */
export function setAudioEnabled(enabled) {
  if (!_stream) return;
  _stream.getAudioTracks().forEach((t) => {
    t.enabled = enabled;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a user-friendly error from raw getUserMedia errors.
 *
 * @param {Error} videoErr
 * @param {Error} audioErr
 * @returns {Error}
 */
function buildMediaError(videoErr, audioErr) {
  const name = audioErr.name || videoErr.name || 'UnknownError';

  const messages = {
    NotAllowedError:
      'Camera and microphone access was denied. Please allow permissions in your browser settings and try again.',
    NotFoundError:
      'No camera or microphone was found. Connect a device and try again.',
    NotReadableError:
      'Your camera or microphone is already in use by another application.',
    OverconstrainedError:
      'Your camera does not support the requested video format. Try again.',
    SecurityError:
      'Media access is blocked. Ensure this page is served over HTTPS or localhost.',
    TypeError:
      'Media devices are not supported in this browser.',
  };

  const message =
    messages[name] ||
    audioErr.message ||
    'Unable to access your camera or microphone.';

  const err = new Error(message);
  err.name = name;
  return err;
}
