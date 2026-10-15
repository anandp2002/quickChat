/**
 * useMediaDevices.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin hook that consumes <MediaProvider> context and attaches the live stream
 * to a video element ref on mount/stream-change.
 *
 * Separates two concerns that components should not mix:
 *   1. Stream lifecycle  → delegated to MediaContext / mediaService
 *   2. Video attachment  → handled here, co-located with the ref
 *
 * Usage
 * ──────
 * const { videoRef, stream, isAcquiring, mediaError, ... } = useMediaDevices();
 *
 * <video ref={videoRef} autoPlay playsInline muted />
 *
 * The hook does NOT call acquire() automatically. The caller is responsible
 * for calling acquire() at the appropriate time (after room join succeeds).
 */

import { useEffect, useRef } from 'react';
import { useMedia } from '@/context/MediaContext';

/**
 * @returns {{
 *   videoRef: import('react').RefObject<HTMLVideoElement>,
 *   stream: MediaStream | null,
 *   isAcquiring: boolean,
 *   mediaError: string | null,
 *   videoEnabled: boolean,
 *   audioEnabled: boolean,
 *   hasCamera: boolean,
 *   hasMicrophone: boolean,
 *   acquire: () => Promise<void>,
 *   release: () => void,
 *   toggleVideo: () => void,
 *   toggleAudio: () => void,
 *   retryAcquire: () => Promise<void>,
 * }}
 */
export function useMediaDevices() {
  const media = useMedia();
  const videoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));

  // Attach / detach the stream to the video element whenever the stream changes.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (media.stream) {
      // Avoid redundant assignment — prevents a brief black-frame flicker.
      if (el.srcObject !== media.stream) {
        el.srcObject = media.stream;
      }
    } else {
      el.srcObject = null;
    }
  }, [media.stream]);

  return {
    videoRef,
    stream: media.stream,
    isAcquiring: media.isAcquiring,
    mediaError: media.mediaError,
    videoEnabled: media.videoEnabled,
    audioEnabled: media.audioEnabled,
    hasCamera: media.hasCamera,
    hasMicrophone: media.hasMicrophone,
    acquire: media.acquire,
    release: media.release,
    toggleVideo: media.toggleVideo,
    toggleAudio: media.toggleAudio,
    retryAcquire: media.retryAcquire,
  };
}
