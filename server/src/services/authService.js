import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';

/**
 * Creates a new user document in the Firestore `users` collection.
 *
 * @param {{ uid: string, name: string, email: string, photoURL?: string|null }} userData
 * @returns {Promise<object>} The created user record.
 */
export const createUser = async ({ uid, name, email, photoURL = null }) => {
  const userDoc = {
    uid,
    name,
    email,
    photoURL,
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

/**
 * Partially updates a user document in Firestore.
 *
 * @param {string} uid
 * @param {object} fields — key/value pairs to merge into the document.
 */
export const updateUser = async (uid, fields) => {
  await db.collection(USERS_COLLECTION).doc(uid).update(fields);
};

/**
 * Retrieves a user document from Firestore by email address.
 *
 * @param {string} email
 * @returns {Promise<object|null>} The user record or null if not found.
 */
export const getUserByEmail = async (email) => {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
};

