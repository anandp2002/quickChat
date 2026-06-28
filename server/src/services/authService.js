import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';

/**
 * Creates a new user document in the Firestore `users` collection.
 *
 * @param {{ uid: string, name: string, email: string }} userData
 * @returns {Promise<object>} The created user record.
 */
export const createUser = async ({ uid, name, email }) => {
  const userDoc = {
    uid,
    name,
    email,
    photoURL: null,
    createdAt: new Date().toISOString(),
  };

  await db.collection(USERS_COLLECTION).doc(uid).set(userDoc);

  return userDoc;
};

/**
 * Retrieves a user document from Firestore by UID.
 *
 * @param {string} uid
 * @returns {Promise<object|null>} The user record or null if not found.
 */
export const getUserByUid = async (uid) => {
  const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
};
