import { auth } from '../config/firebase.js';

/**
 * Express middleware that verifies a Firebase ID token from the
 * `Authorization: Bearer <token>` header.
 *
 * On success, attaches the decoded token to `req.user` so downstream
 * controllers can access `req.user.uid`, `req.user.email`, etc.
 */
export const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header.' });
  }

  const idToken = header.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
