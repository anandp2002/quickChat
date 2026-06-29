import * as authService from '../services/authService.js';

/**
 * POST /api/auth/register
 *
 * Creates a user document in Firestore after the client has already
 * created the Firebase Auth account. Requires a verified ID token.
 *
 * Body: { name: string }
 */
export const register = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const { uid, email, picture } = req.user;

    // Check if user already exists by UID (idempotent)
    const existingUser = await authService.getUserByUid(uid);
    if (existingUser) {
      // Backfill photoURL when a user who registered with email/password
      // later signs in with Google (which provides a profile picture).
      if (!existingUser.photoURL && picture) {
        await authService.updateUser(uid, { photoURL: picture });
        existingUser.photoURL = picture;
      }
      return res.status(200).json({ user: existingUser });
    }

    // Check if a *different* account already registered with this email
    const emailOwner = await authService.getUserByEmail(email);
    if (emailOwner && emailOwner.uid !== uid) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in with your original method.',
      });
    }

    const user = await authService.createUser({
      uid,
      name: name.trim(),
      email,
      photoURL: picture || null,
    });

    return res.status(201).json({ user });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to create user profile.' });
  }
};

/**
 * GET /api/auth/me
 *
 * Returns the current user's Firestore profile.
 * Useful for syncing profile data after login.
 */
export const getMe = async (req, res) => {
  try {
    const { uid } = req.user;

    const user = await authService.getUserByUid(uid);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};
