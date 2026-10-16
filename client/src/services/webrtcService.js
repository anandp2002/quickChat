/**
 * webrtcService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stateless WebRTC utility functions for RTCPeerConnection configuration.
 *
 * This service provides ICE server configuration and a factory function for
 * creating RTCPeerConnection instances. It does NOT manage connection
 * lifecycle — that responsibility belongs to the useWebRTC hook.
 *
 * ICE Server Configuration
 * ────────────────────────
 * Uses Google's public STUN servers by default. For production deployments
 * behind symmetric NATs or firewalls, configure via environment variables:
 *
 *   VITE_STUN_URL             — Custom STUN URL (default: stun:stun.l.google.com:19302)
 *   VITE_TURN_URL             — TURN server URL  (optional, required for NAT traversal)
 *   VITE_TURN_USERNAME        — TURN username    (optional, use short-lived credentials)
 *   VITE_TURN_CREDENTIAL      — TURN credential  (optional, use short-lived credentials)
 *   VITE_ICE_TRANSPORT_POLICY — 'all' (default) or 'relay'
 *                                Set to 'relay' to force all traffic through TURN;
 *                                useful for verifying TURN connectivity in tests.
 *
 * ⚠ Do NOT hardcode permanent TURN credentials in the frontend.
 *   Use a backend token-vending endpoint that issues short-lived TURN
 *   credentials on demand for production deployments.
 *
 * Candidate types
 * ───────────────
 *   host   — local LAN/loopback address; works on same network without STUN/TURN.
 *   srflx  — server-reflexive; STUN discovers the public IP:port behind NAT.
 *   relay  — TURN relay; used when no direct path is available.
 *
 * STUN discovers addresses; TURN relays media. STUN is always free; TURN
 * carries the actual audio/video traffic on restricted networks.
 */

const DEFAULT_STUN = 'stun:stun.l.google.com:19302';
const BACKUP_STUN = 'stun:stun1.l.google.com:19302';

/**
 * Build the ICE servers array from environment configuration or defaults.
 *
 * @returns {RTCIceServer[]}
 */
export function getIceServers() {
  /** @type {RTCIceServer[]} */
  const servers = [];

  // Primary STUN server (configurable via env)
  const stunUrl = import.meta.env.VITE_STUN_URL || DEFAULT_STUN;
  servers.push({ urls: stunUrl });

  // Backup STUN server (always included unless it matches the primary)
  if (stunUrl !== BACKUP_STUN) {
    servers.push({ urls: BACKUP_STUN });
  }

  // Optional TURN server from environment variables.
  // Env var names match the client .env file exactly.
  const turnUrl        = import.meta.env.VITE_TURN_URL;
  const turnUsername   = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls:       turnUrl,
      username:   turnUsername,
      credential: turnCredential,
    });
  } else if (turnUrl) {
    console.warn(
      '[webrtcService] VITE_TURN_URL is set but VITE_TURN_USERNAME / ' +
      'VITE_TURN_CREDENTIAL are missing — TURN server will not be used.',
    );
  }

  return servers;
}

/**
 * Create a new RTCPeerConnection with the application's ICE configuration.
 *
 * @param {RTCConfiguration} [overrides] — Optional configuration overrides.
 *   Any properties provided here will merge with/override defaults
 *   (e.g. custom iceServers, iceTransportPolicy).
 * @returns {RTCPeerConnection}
 */
export function createPeerConnection(overrides = {}) {
  // iceTransportPolicy:
  //   'all'   — allow host, srflx, and relay candidates (default).
  //   'relay' — only relay candidates; useful to verify TURN connectivity.
  const policy = import.meta.env.VITE_ICE_TRANSPORT_POLICY || 'all';

  const config = {
    iceServers: getIceServers(),
    iceTransportPolicy: policy === 'relay' ? 'relay' : 'all',
    ...overrides,
  };

  if (import.meta.env.DEV) {
    console.log('[webrtcService] RTCPeerConnection config:', {
      iceServersCount: config.iceServers.length,
      iceTransportPolicy: config.iceTransportPolicy,
    });
  }

  return new RTCPeerConnection(config);
}
